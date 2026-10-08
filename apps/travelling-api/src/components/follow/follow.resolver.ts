import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FollowService } from './follow.service';
import { UseGuards, InternalServerErrorException } from '@nestjs/common';
import { Follower, Followings, Followers } from '../../libs/dto/follow/follow';
import { FollowInquiry } from '../../libs/dto/follow/follow.input';
import { Message } from '../../libs/types/common';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';
import * as mongoose from 'mongoose';


@Resolver()
export class FollowResolver {
     constructor(private readonly followService: FollowService){}

     	@UseGuards(AuthGuard)
	@Mutation(() => Follower)
	public async subscribe(@Args('input') input: string, @AuthMember('_id') memberId: mongoose.ObjectId): Promise<Follower> {
		console.log('Mutation: subscribe');
		const followingId = shapeIntoMongoObjectId(input);
		return await this.followService.subscribe(memberId, followingId);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Follower)
	public async unsubscribe(@Args('input') input: string, @AuthMember('_id') memberId: mongoose.ObjectId): Promise<Follower> {
		console.log('Mutation: unsubscribe');
		const followingId = shapeIntoMongoObjectId(input);
		return await this.followService.unsubscribe(memberId, followingId);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Followings)
	public async getMemberFollowings(
		@Args('input') input: FollowInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId | null,
	): Promise<Followings> {
		console.log('Query: getMemberfollowings');
		const { followerId } = input.search;
		if (!followerId) throw new InternalServerErrorException(Message.BAD_REQUEST);
		input.search.followerId = shapeIntoMongoObjectId(followerId);
		return await this.followService.getMemberFollowings(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Followers)
	public async getMemberFollowers(
		@Args('input') input: FollowInquiry,
		@AuthMember('_id') memberId: mongoose.ObjectId | null,
	): Promise<Followers> {
		console.log('Query: getMemberFollowers');
		const { followingId } = input.search;
		if (!followingId) throw new InternalServerErrorException(Message.BAD_REQUEST);
		input.search.followingId = shapeIntoMongoObjectId(followingId);
		return await this.followService.getMemberFollowers(memberId, input);
	}
}
