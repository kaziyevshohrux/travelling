import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, Min, ValidateNested } from 'class-validator';
import * as mongoose from 'mongoose';

@InputType()
class FollowSearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	followingId?: mongoose.ObjectId;

	@IsOptional()
	@Field(() => String, { nullable: true })
	followerId?: mongoose.ObjectId;
}

@InputType()
export class FollowInquiry {
	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	page: number;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsNotEmpty()
	@ValidateNested()
	@Type(() => FollowSearch)
	@Field(() => FollowSearch)
	search: FollowSearch;
}
