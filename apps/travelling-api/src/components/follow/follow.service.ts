import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MemberService } from '../member/member.service';
import { ClientSession, Model, ObjectId, PipelineStage } from 'mongoose';
import { Follower, Followers, Following, Followings } from '../../libs/dto/follow/follow';
import { Direction, Message, T } from '../../libs/types/common';
import { FollowInquiry } from '../../libs/dto/follow/follow.input';
import { lookupAuthMemberFollowed, lookupAuthMemberLiked } from '../../libs/config';
import { LikeGroup } from '../../libs/enums/like.enum';
import { MemberStatus } from '../../libs/enums/member.enum';

@Injectable()
export class FollowService {
    constructor(
        @InjectModel("Follow") private readonly followModel: Model<Follower | Following>,
        private readonly memberService: MemberService
    ){}
    
    public async subscribe(followerId: ObjectId, followingId: ObjectId): Promise<Follower> {
		if (followerId.toString() === followingId.toString()) {
			throw new InternalServerErrorException(Message.SELF_SUBSCRIPTION_DENIED);
		}

		const targetMember = await this.memberService.getMember(null, followingId);
		if (!targetMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return this.withTransaction(async (session) => {
			const result = await this.registerSubscription(followerId, followingId, session);
			await this.memberService.memberStatsEditor(
				{ _id: followerId, targetKey: 'memberFollowings', modifier: 1 },
				session,
			);
			await this.memberService.memberStatsEditor(
				{ _id: followingId, targetKey: 'memberFollowers', modifier: 1 },
				session,
			);
			return result;
		});
	}

	private async registerSubscription(
		followerId: ObjectId,
		followingId: ObjectId,
		session: ClientSession,
	): Promise<Follower> {
		try {
			const [result] = await this.followModel.create(
				[{ followingId, followerId }],
				{ session },
			);
			return result as Follower;
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unknown error occurred';
			console.log('Error: Service.model', message);
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async unsubscribe(followerId: ObjectId, followingId: ObjectId): Promise<Follower> {
		const targetMember = await this.memberService.getMember(null, followingId);
		if (!targetMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return this.withTransaction(async (session) => {
			const result = await this.followModel
				.findOneAndDelete({ followingId, followerId })
				.session(session)
				.exec();
			if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

			await this.memberService.memberStatsEditor(
				{ _id: followerId, targetKey: 'memberFollowings', modifier: -1 },
				session,
			);
			await this.memberService.memberStatsEditor(
				{ _id: followingId, targetKey: 'memberFollowers', modifier: -1 },
				session,
			);
			return result as Follower;
		});
	}

	public async getMemberFollowings(memberId: ObjectId | null, input: FollowInquiry): Promise<Followings> {
		const { page, limit, search } = input;
		if (!search?.followerId) throw new InternalServerErrorException(Message.BAD_REQUEST);
		this.validatePagination(page, limit);
		const match: T = { followerId: search?.followerId };

		const result = await this.followModel
			.aggregate([
				{ $match: match },
				this.lookupEligibleMember('followingId', 'followingData'),
				{ $unwind: '$followingData' },
				{ $sort: { createdAt: Direction.DESC, _id: Direction.DESC } },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							lookupAuthMemberLiked(memberId, '$followingId', LikeGroup.MEMBER),
							lookupAuthMemberFollowed({ followerId: memberId, followingId: '$followingId'}),
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0] as Followings;
	}

	public async getMemberFollowers(memberId: ObjectId | null, input: FollowInquiry): Promise<Followers> {
		const { page, limit, search } = input;
		if (!search?.followingId) throw new InternalServerErrorException(Message.BAD_REQUEST);
		this.validatePagination(page, limit);

		const match: T = { followingId: search?.followingId };

		const result = await this.followModel
			.aggregate([
				{ $match: match },
				this.lookupEligibleMember('followerId', 'followerData'),
				{ $unwind: '$followerData' },
				{ $sort: { createdAt: Direction.DESC, _id: Direction.DESC } },
				{
					$facet: {
						list: [
							{ $skip: (page - 1) * limit },
							{ $limit: limit },
							lookupAuthMemberLiked(memberId, '$followerId', LikeGroup.MEMBER),
							lookupAuthMemberFollowed({ followerId: memberId, followingId: '$followerId'}),
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0] as Followers;
	}

	private lookupEligibleMember(
		localField: 'followingId' | 'followerId',
		as: 'followingData' | 'followerData',
	): PipelineStage.Lookup {
		return {
			$lookup: {
				from: 'members',
				let: { memberId: `$${localField}` },
				pipeline: [
					{
						$match: {
							$expr: { $eq: ['$_id', '$$memberId'] },
							memberStatus: { $in: [MemberStatus.ACTIVE, MemberStatus.BLOCK] },
						},
					},
					{ $project: { memberPassword: 0 } },
				],
				as,
			},
		};
	}

	private validatePagination(page: number, limit: number): void {
		if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
			throw new BadRequestException(Message.BAD_REQUEST);
		}
	}

	private async withTransaction<T>(work: (session: ClientSession) => Promise<T>): Promise<T> {
		const session = await this.followModel.db.startSession();
		let result: T | undefined;
		try {
			await session.withTransaction(async () => {
				result = await work(session);
			});
			if (result === undefined) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
			return result;
		} finally {
			await session.endSession();
		}
	}
}
