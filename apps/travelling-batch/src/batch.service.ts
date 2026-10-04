import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property } from '../../travelling-api/src/libs/dto/property/property';
import { Member } from '../../travelling-api/src/libs/dto/member/member';
import { PropertyStatus } from '../../travelling-api/src/libs/enums/property.enum';
import { MemberStatus, MemberType } from '../../travelling-api/src/libs/enums/member.enum';

@Injectable()
export class BatchService {
  constructor(
    @InjectModel('Property') private readonly propertyModel: Model<Property>,
    @InjectModel('Member') private readonly memberModel: Model<Member>,
  ) {}

  public async batchRollback(): Promise<void> { //bu JobSchedule batchTopProperties va batchTopAgents dan oldin ishga tushadi
    await this.propertyModel
      .updateMany( //update static methodi 3 ta parametr qabul qiladi: filter, update, options
        {
          propertyStatus: PropertyStatus.ACTIVE,
        },
        { propertyRank: 0 },
      )
      .exec();

    await this.memberModel
      .updateMany(
        {
          memberStatus: MemberStatus.ACTIVE,
          memberType: MemberType.AGENT,
        },
        { memberRank: 0 },
      )
      .exec();
  }

 public async batchTopProperties(): Promise<void> {
    const properties: Property[] = await this.propertyModel
      .find({
        propertyStatus: PropertyStatus.ACTIVE,
        propertyRank: 0,
      })
      .exec();

    const promisedList = properties.map(async (ele: Property) => {
      const { _id, propertyLikes, propertyViews } = ele;
      const rank = propertyLikes * 2 + propertyViews * 1;
      return await this.propertyModel.findByIdAndUpdate(_id, { propertyRank: rank });
    });

    await Promise.all(promisedList);
  }

  public async batchTopAgents(): Promise<void> {
    const agents: Member[] = await this.memberModel
      .find({
        memberType: MemberType.AGENT,
        memberStatus: MemberStatus.ACTIVE,
        memberRank: 0,
      })
      .exec();

    const promisedList = agents.map(async (ele: Member) => { //promisedList bu pending object bolib quyida promise all orqali har bir jarayonni ishga tushirishni amalga oshirdik
      const { _id, memberProperties, memberLikes, memberArticles, memberViews } = ele;
      const rank = (memberProperties ?? 0) * 5 + (memberArticles ?? 0) * 3 + (memberLikes ?? 0) * 2 + memberViews * 1;
      return await this.memberModel.findByIdAndUpdate(_id, { memberRank: rank });
    });

    await Promise.all(promisedList);
  }

   public getHello(): string {
    return 'Welcome to Travelling BATCH Server!';
  }
}
