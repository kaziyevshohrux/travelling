import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { lookupFavoriteProduct } from '../../libs/config';
import { Like, MeLiked } from '../../libs/dto/like/like';
import { LikeInput } from '../../libs/dto/like/like.input';
import { OrdinaryInquiry } from '../../libs/dto/product/product.input';
import { Products } from '../../libs/dto/product/product';
import { LikeGroup } from '../../libs/enums/like.enum';
import { Message, T } from '../../libs/types/common';

@Injectable()
export class LikeService {
	constructor(@InjectModel('Like') private readonly likeModel: Model<Like>) {}

	public async toggleLike(input: LikeInput): Promise<number> {
		const search: T = {
			memberId: input.memberId,
			likeRefId: input.likeRefId,
			likeGroup: input.likeGroup,
		};
		const exist = await this.likeModel.findOne(search).exec();
		if (exist) {
			await this.likeModel.findOneAndDelete(search).exec();
			return -1;
		}

		try {
			await this.likeModel.create(input);
			return 1;
		} catch (error) {
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async checkLikeExistence(input: LikeInput): Promise<MeLiked[]> {
		const { memberId, likeRefId, likeGroup } = input;
		const result = await this.likeModel.findOne({ memberId, likeRefId, likeGroup }).exec();
		return result ? [{ memberId, likeRefId, myFavorite: true }] : [];
	}

	public async getFavoriteProducts(memberId: ObjectId, input: OrdinaryInquiry): Promise<Products> {
		const data: T = await this.likeModel
			.aggregate([
				{ $match: { likeGroup: LikeGroup.PRODUCT, memberId } },
				{ $sort: { updatedAt: -1 } },
				{
					$lookup: {
						from: 'products',
						localField: 'likeRefId',
						foreignField: '_id',
						as: 'favoriteProduct',
					},
				},
				{ $unwind: '$favoriteProduct' },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupFavoriteProduct,
							{ $unwind: '$favoriteProduct.memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return {
			list: data[0].list.map((element) => element.favoriteProduct),
			metaCounter: data[0].metaCounter,
		};
	}
}
