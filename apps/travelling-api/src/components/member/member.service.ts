import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, ObjectId } from 'mongoose';
import { Member, Members, MyProfile } from '../../libs/dto/member/member';
import { AgentInquiry, LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { Direction, Message, StatisticModifier, T } from '../../libs/types/common';
import { AuthService } from '../auth/auth.service';
import { ChangeMyPasswordInput, MemberUpdate, MyProfileUpdate } from '../../libs/dto/member/member.update';
import { ViewInput } from '../../libs/dto/view/view.input';
import { ViewGroup } from '../../libs/enums/view.enum';
import { ViewService } from '../view/view.service';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { LikeService } from '../like/like.service';
import { Follower, Following, MeFollowed } from '../../libs/dto/follow/follow';
import { FollowService } from '../follow/follow.service';
import { lookupAuthMemberLiked } from '../../libs/config';

@Injectable()
export class MemberService {

    constructor(@InjectModel("Member") private readonly memberModel : Model<Member>,
	@InjectModel('Follow') private readonly followModel: Model<Follower | Following>,
  private authService: AuthService,
  private viewService: ViewService,
  private likeService: LikeService,

){}

//SignUp
    public async signup(input: MemberInput): Promise<Member> {
  // TODO: Hash password
  input.memberPassword = await this.authService.hashPassword(input.memberPassword)

  try {
    const result = await this.memberModel.create(input);

    result.accessToken = await this.authService.createToken(result)
    // TODO: Authentication via TOKEN

    return result;
  } catch (err) {
    console.log('Error, Service.model:', err);
    throw new BadRequestException(Message.USED_MEMBERNICK_OR_PHONE);
  }
}

//Login
   public async login(input: LoginInput): Promise<Member> {
  const { memberNick, memberPassword } = input;

  const response: Member | null = await this.memberModel
    .findOne({ memberNick: memberNick })
    .select('+memberPassword')
    .exec();

  if (!response || response.memberStatus === MemberStatus.DELETE) {
    throw new InternalServerErrorException(Message.NO_MEMBER_NICK);
  } else if (response.memberStatus === MemberStatus.BLOCK) {
    throw new InternalServerErrorException(Message.BLOCKED_USER);
  }

  const password = response.memberPassword;
  // TODO: Compare passwords
  const isMatch = await this.authService.comparePasswords(input.memberPassword, password as string)

  if (!isMatch) {
    throw new InternalServerErrorException(Message.WRONG_PASSWORD);
  }

  response.accessToken = await this.authService.createToken(response)

  return response;
}

// update member inf

    public async getMyProfile(memberId: ObjectId): Promise<MyProfile> {
		const result = await this.memberModel
			.findOne({ _id: memberId, memberStatus: MemberStatus.ACTIVE })
			.select(this.myProfileProjection())
			.lean()
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result as unknown as MyProfile;
    }

    public async updateMember(memberId: ObjectId, input: MyProfileUpdate): Promise<MyProfile> {
		const set: T = {};
		const unset: T = {};
		const nonClearable = ['memberPhone', 'memberNick'] as const;
		const clearable = ['memberFullName', 'memberImage', 'memberAddress', 'memberDesc'] as const;

		for (const field of nonClearable) {
			if (!Object.prototype.hasOwnProperty.call(input, field)) continue;
			const value = input[field];
			if (value === null || value === undefined || value === '') {
				throw new BadRequestException(Message.BAD_REQUEST);
			}
			set[field] = value;
		}
		for (const field of clearable) {
			if (!Object.prototype.hasOwnProperty.call(input, field)) continue;
			const value = input[field];
			if (value === null) unset[field] = 1;
			else if (value !== undefined) set[field] = value;
		}

		await this.ensureUniqueProfileFields(memberId, set.memberNick, set.memberPhone);
		const update: T = {};
		if (Object.keys(set).length) update.$set = set;
		if (Object.keys(unset).length) update.$unset = unset;
		if (!Object.keys(update).length) return this.getMyProfile(memberId);

		try {
			const result = await this.memberModel
				.findOneAndUpdate({ _id: memberId, memberStatus: MemberStatus.ACTIVE }, update, { new: true })
				.select(this.myProfileProjection())
				.lean()
				.exec();
			if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
			return result as unknown as MyProfile;
		} catch (error) {
			if ((error as { code?: number }).code === 11000) {
				throw new BadRequestException(Message.USED_MEMBERNICK_OR_PHONE);
			}
			throw error;
		}
    }

	public async changeMyPassword(memberId: ObjectId, input: ChangeMyPasswordInput): Promise<boolean> {
		const member = await this.memberModel
			.findOne({ _id: memberId, memberStatus: MemberStatus.ACTIVE })
			.select('+memberPassword')
			.exec();
		if (!member?.memberPassword) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		const matches = await this.authService.comparePasswords(input.currentPassword, member.memberPassword);
		if (!matches) throw new BadRequestException(Message.WRONG_PASSWORD);
		member.memberPassword = await this.authService.hashPassword(input.newPassword);
		await member.save();
		return true;
	}

//getMember 
   public async getMember(memberId: ObjectId  | null, targetId: ObjectId): Promise<Member> {
  const search: T = {
    _id: targetId,
    memberStatus: {
      $in: [MemberStatus.ACTIVE, MemberStatus.BLOCK],
    },
  };

  const targetMember : Member | null  = await this.memberModel.findOne(search).lean().exec();
  if (!targetMember) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

  if (memberId) {
    const viewInput = {
      memberId: memberId,
      viewRefId: targetId,
      viewGroup: ViewGroup.MEMBER,
    };

    const newView = await this.viewService.recordView(viewInput);

    if (newView) {
      await this.memberModel.findOneAndUpdate(
        search,
        { $inc: { memberViews: 1 } },
        { new: true }
      ).exec();

      targetMember.memberViews++;
    }

    const likeInput = {
      memberId: memberId,
      likeRefId: targetId,
      likeGroup: LikeGroup.MEMBER,
    };

    targetMember.meLiked = await this.likeService.checkLikeExistence(likeInput);

    // meFollowed
	targetMember.meFollowed = await this.checkSubscription(memberId, targetId);
  }

  return targetMember;
}




//likemember 

public async likeTargetMember(memberId: ObjectId, likeRefId: ObjectId): Promise<Member> {
		const target = (await this.memberModel
			.findOne({ _id: likeRefId, memberStatus: MemberStatus.ACTIVE })
			.exec()) as Member;
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = {
			memberId: memberId,
			likeRefId: likeRefId,
			likeGroup: LikeGroup.MEMBER,
		};

		// LIKE TOGGLE via Like modules
		const modifier: number = await this.likeService.toggleLike(input);
		const result = await this.memberStatsEditor({ _id: likeRefId, targetKey: 'memberLikes', modifier: modifier });

		if (!result) throw new InternalServerErrorException(Message.SOMETHING_WENT_WRONG);
		return result;
	}


//get Agents
     public async getAgents(memberId: ObjectId, input: AgentInquiry): Promise<Members> {
		const { text } = input.search;
		const match: T = { memberType: MemberType.AGENT, memberStatus: MemberStatus.ACTIVE };
		const sort: T = { [input?.sort ?? 'createdAt']: input.direction ?? Direction.DESC ? -1: 1 }; //sort optionalligi sababli agar kiritilmagan bolsa createdAt avtomatik tanlanadi

		if (text) match.memberNick = { $regex: new RegExp(text, 'i') };
		console.log('match', match);

		const result = await this.memberModel
			.aggregate([
				//aggregate pipelardan iborat bolib objectlardan iborat array qabul qiladi
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						//bir aggregate ichida bir nechta query natijalarini olish imkonini beradi
						list: [{ $skip: (input.page - 1) * input.limit },
							 { $limit: input.limit },
							 lookupAuthMemberLiked(memberId, '$_id', LikeGroup.MEMBER)
							], //talab etilgan agentlar royxatini olib beradi

						metaCounter: [{ $count: 'total' }], //agentlar umumiy sonini hisoblaymiz
					},
				},
			])
			.exec();
		console.log('result:', result);
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];

    }

    
//getAgents Admin 
    	public async getAllMembersByAdmin(input: MembersInquiry): Promise<Members> {
		const { memberStatus, memberType, text } = input.search;
		const match: T = {};
		const sort: T = { [input?.sort ?? 'createdAt']: input.direction ?? Direction.DESC }; //sort optionalligi sababli agar kiritilmagan bolsa createdAt avtomatik tanlanadi
		if (memberStatus) match.memberStatus = memberStatus;
		if (memberType) match.memberType = memberType;
		if (text) match.memberNick = { $regex: new RegExp(text, 'i') };
		console.log('match', match);

		const result = await this.memberModel
			.aggregate([
				//aggregate pipelardan iborat bolib objectlardan iborat array qabul qiladi
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						//bir aggregate ichida bir nechta query natijalarini olish imkonini beradi
						list: [{ $skip: (input.page - 1) * input.limit }, { $limit: input.limit }], //talab etilgan agentlar royxatini olib beradi
						metaCounter: [{ $count: 'total' }], //agentlar umumiy sonini hisoblaymiz
					},
				},
			])
			.exec();
		console.log('result:', result);
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		return result[0];
	}


// updateMember by admin 
	public async updateMemberByAdmin(input: MemberUpdate): Promise<Member> {
		const result = await this.memberModel.findOneAndUpdate({ _id: input._id }, input, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);
		return result;
	}

	private async checkSubscription(followerId: ObjectId, followingId: ObjectId): Promise<MeFollowed[]> {
		const result = await this.followModel.findOne({ followingId: followingId, followerId: followerId }).exec();
		return result ? [{ followerId: followerId, followingId: followingId, myFollowing: true }] : [];
	}



	public async memberStatsEditor(input: StatisticModifier, session?: ClientSession): Promise<Member> {
		//memberga dahldor kerakli qiymatni ozgartirish imkonini beruvchi method
		const { _id, targetKey, modifier } = input;
		const update = modifier < 0
			? [{ $set: { [targetKey]: { $max: [0, { $add: [{ $ifNull: [`$${targetKey}`, 0] }, modifier] }] } } }]
			: { $inc: { [targetKey]: modifier } };
		const query = this.memberModel.findOneAndUpdate({ _id }, update, { new: true });
		if (session) query.session(session);
		const result = await query.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result as Member;
	}

	private myProfileProjection(): T {
		return {
			_id: 1,
			memberType: 1,
			memberAuthType: 1,
			memberPhone: 1,
			memberNick: 1,
			memberFullName: 1,
			memberImage: 1,
			memberAddress: 1,
			memberDesc: 1,
			memberProducts: 1,
			memberArticles: 1,
			memberFollowers: 1,
			memberFollowings: 1,
			createdAt: 1,
			updatedAt: 1,
		};
	}

	private async ensureUniqueProfileFields(
		memberId: ObjectId,
		memberNick?: string,
		memberPhone?: string,
	): Promise<void> {
		const alternatives: T[] = [];
		if (memberNick) alternatives.push({ memberNick });
		if (memberPhone) alternatives.push({ memberPhone });
		if (!alternatives.length) return;
		const duplicate = await this.memberModel.exists({ _id: { $ne: memberId }, $or: alternatives });
		if (duplicate) throw new BadRequestException(Message.USED_MEMBERNICK_OR_PHONE);
	}


}


