import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Member, Members } from '../../libs/dto/member/member';
import { AgentInquiry, LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { Direction, Message, StatisticModifier, T } from '../../libs/types/common';
import { AuthService } from '../auth/auth.service';
import { MemberUpdate } from '../../libs/dto/member/member.update';
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

     public async updateMember(memberId: ObjectId, input: MemberUpdate): Promise<Member> {
		const result = await this.memberModel
			.findOneAndUpdate({ _id: memberId, memberStatus: MemberStatus.ACTIVE }, input, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.UPLOAD_FAILED);
		result.accessToken = await this.authService.createToken(result);
		return result;
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
							 lookupAuthMemberLiked(memberId)
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



	public async memberStatsEditor(input: StatisticModifier): Promise<Member> {
		//memberga dahldor kerakli qiymatni ozgartirish imkonini beruvchi method
		const { _id, targetKey, modifier } = input;
		return (await this.memberModel
			.findOneAndUpdate({ _id }, { $inc: { [targetKey]: modifier } }, { new: true })
			.exec()) as Member; //masalan {memberProperties: 1}
	}


}


