import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../../travelling-api/src/libs/dto/product/product';
import { Member } from '../../travelling-api/src/libs/dto/member/member';
import { ProductStatus } from '../../travelling-api/src/libs/enums/product.enum';
import { MemberStatus, MemberType } from '../../travelling-api/src/libs/enums/member.enum';

@Injectable()
export class BatchService {
  constructor(
    @InjectModel('Product') private readonly productModel: Model<Product>,
    @InjectModel('Member') private readonly memberModel: Model<Member>,
  ) {}

  public async batchRollback(): Promise<void> {
    await this.productModel
      .updateMany( //update static methodi 3 ta parametr qabul qiladi: filter, update, options
        {
          productStatus: ProductStatus.ACTIVE,
        },
        { productRank: 0 },
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

 public async batchTopProducts(): Promise<void> {
    const products: Product[] = await this.productModel
      .find({
        productStatus: ProductStatus.ACTIVE,
        productRank: 0,
      })
      .exec();

    const promisedList = products.map(async (ele: Product) => {
      const { _id, productLikes, productViews } = ele;
      const rank = productLikes * 2 + productViews * 1;
      return await this.productModel.findByIdAndUpdate(_id, { productRank: rank });
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
      const { _id, memberProducts, memberLikes, memberArticles, memberViews } = ele;
      const rank = (memberProducts ?? 0) * 5 + (memberArticles ?? 0) * 3 + (memberLikes ?? 0) * 2 + memberViews * 1;
      return await this.memberModel.findByIdAndUpdate(_id, { memberRank: rank });
    });

    await Promise.all(promisedList);
  }

   public getHello(): string {
    return 'Welcome to Travelling BATCH Server!';
  }
}
