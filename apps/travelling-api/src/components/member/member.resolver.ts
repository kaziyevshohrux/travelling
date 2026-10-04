import { Mutation, Resolver , Query, Args } from '@nestjs/graphql';
import { MemberService } from './member.service';
import { InternalServerErrorException, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AgentInquiry, LoginInput, MemberInput, MembersInquiry } from '../../libs/dto/member/member.input';
import { Member, Members } from '../../libs/dto/member/member';
import { AuthGuard } from '../auth/guards/auth.guard';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MemberType } from '../../libs/enums/member.enum';
import { MemberUpdate } from '../../libs/dto/member/member.update';
import * as mongoose from 'mongoose';
import { getSerialForImage, shapeIntoMongoObjectId, validMimeTypes } from '../../libs/config';
import { WithoutGuard } from '../auth/guards/without.guard';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { createWriteStream } from 'fs';
import { Message } from '../../libs/types/common';


@Resolver()
export class MemberResolver {
    constructor(private readonly memberService: MemberService){}
// SignUp
    @Mutation(() => Member)
    public async signup(@Args("input") input: MemberInput):Promise<Member>{
    console.log("signup")
    return await this.memberService.signup(input)}
        

//Login  
   
    @Mutation(() => Member)
    public async login(@Args("input") input: LoginInput):Promise<Member>{
    console.log("login")
    return await this.memberService.login(input)
    }


// autentication check
  @UseGuards(AuthGuard)    //req.body + authMember
	@Mutation(() => String)
	public async checkAuth(@AuthMember('memberNick') memberNick: string): Promise<string> {  // authmember <=>  @AuthMember
	console.log('Query checkAuth');
	console.log('memberNick[auth] =>', memberNick);
		return `Hi ${memberNick}, you are authenticated!`; ;
	}

//dto > guard > inceptor
// autherization = authentication + permission
  @Roles(MemberType.USER, MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => String)
	public async checkAuthRoles(@AuthMember() authMember: Member): Promise<string> {
		console.log('Query checkAuth');
		return `Hi ${authMember.memberNick}, you are ${authMember.memberType} (memberId: ${authMember._id})`; 
	}


//update member 
      @UseGuards(AuthGuard)
      @Mutation(() => Member)
    public async updateMember(
      @Args('input') input : MemberUpdate,
     @AuthMember('_id') memberId: mongoose.ObjectId ,): Promise<Member> {
        console.log("updateMember")
        delete input._id
            return await this.memberService.updateMember(memberId, input)
        
    }


//get Member 
      @UseGuards(WithoutGuard)
      @Query(() => Member)
	public async getMember(
    @Args("memberId") input: string, 
    @AuthMember('_id') memberId: mongoose.ObjectId)
  : Promise<Member> {
		console.log('Mutation: getMember');
		const targetId = shapeIntoMongoObjectId(input);
			 return await this.memberService.getMember(memberId, targetId);
        
    }


    //getAgents

    	 @UseGuards(WithoutGuard) //agentlar royxatini butun malumotlar bilan birgalikda olib beradi
    @Query(() => Members)
    public async getAgents(
      @Args("input") input: AgentInquiry,
     @AuthMember('_id') memberId: mongoose.ObjectId): Promise<Members>{
        console.log("Query getAgents")
        return await this.memberService.getAgents(memberId, input);
    }

	//like 


	@UseGuards(AuthGuard)
	@Mutation(() => Member)
	public async likeTargetMember(
		@Args('memberId') input: string,
		@AuthMember('_id') memberId: mongoose.ObjectId,
	): Promise<Member> {
		console.log('Mutation: likeTargetMember');
		const likeRefId = shapeIntoMongoObjectId(input);
		return await this.memberService.likeTargetMember(memberId, likeRefId);
	}


    /** ADMIN **/

	// Authorization: Admin


	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Members)
    public async getAllMembersByAdmin(@Args("input") input: MembersInquiry): Promise<Members> {
           console.log("Mutation: getAllMembersByAdmin");
        return await this.memberService.getAllMembersByAdmin(input);

	}

		// Authorization: Admin
	 @Roles(MemberType.ADMIN)
    @UseGuards(RolesGuard)
    @Mutation(() => Member) 
    public async updateMemberByAdmin(@Args("input") input: MemberUpdate): Promise<Member> {
        console.log("Mutation: updateMember");
        return await this.memberService.updateMemberByAdmin(input);
    }



// IMAGE UPLOADER (member.resolver.ts)


@UseGuards(AuthGuard)
@Mutation((returns) => String)
public async imageUploader(
	@Args({ name: 'file', type: () => GraphQLUpload })
{ createReadStream, filename, mimetype }: FileUpload,
@Args('target') target: String,
): Promise<string> {
	console.log('Mutation: imageUploader');

	if (!filename) throw new Error(Message.UPLOAD_FAILED);
const validMime = validMimeTypes.includes(mimetype);
if (!validMime) throw new Error(Message.PROVIDE_ALLOWED_PHOTO);

const imageName = getSerialForImage(filename);
const url = `uploads/${target}/${imageName}`;
const stream = createReadStream();

const result = await new Promise((resolve, reject) => {
	stream
		.pipe(createWriteStream(url))
		.on('finish', async () => resolve(true))
		.on('error', () => reject(false));
});
if (!result) throw new Error(Message.UPLOAD_FAILED);

return url;
}

@UseGuards(AuthGuard)
@Mutation((returns) => [String])
public async imagesUploader(
	@Args('files', { type: () => [GraphQLUpload] })
files: Promise<FileUpload>[],
@Args('target') target: String,
): Promise<string[]> {
	console.log('Mutation: imagesUploader');

	const uploadedImages : string[] = [];
	const promisedList = files.map(async (img: Promise<FileUpload>, index: number): Promise<Promise<void>> => {
		try {
			const { filename, mimetype, encoding, createReadStream } = await img;

			const validMime = validMimeTypes.includes(mimetype);
			if (!validMime) throw new Error(Message.PROVIDE_ALLOWED_PHOTO);

			const imageName = getSerialForImage(filename);
			const url = `uploads/${target}/${imageName}`;
			const stream = createReadStream();

			const result = await new Promise((resolve, reject) => {
				stream
					.pipe(createWriteStream(url))
					.on('finish', () => resolve(true))
					.on('error', () => reject(false));
			});
			if (!result) throw new Error(Message.UPLOAD_FAILED);

			uploadedImages[index] = url ;
		} catch (err) {
			console.log('Error, file missing!');
		}
	});

	await Promise.all(promisedList);
	return uploadedImages;
}




}
