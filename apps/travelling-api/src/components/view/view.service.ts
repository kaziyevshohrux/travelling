import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { lookupVisitedProduct } from '../../libs/config';
import { Products } from '../../libs/dto/product/product';
import { OrdinaryInquiry } from '../../libs/dto/product/product.input';
import { ProductStatus } from '../../libs/enums/product.enum';
import { View } from '../../libs/dto/view/view';
import { ViewInput } from '../../libs/dto/view/view.input';
import { ViewGroup } from '../../libs/enums/view.enum';
import { T } from '../../libs/types/common';

@Injectable()
export class ViewService {
	constructor(@InjectModel('View') private readonly viewModel: Model<View>) {}

	public async recordView(input: ViewInput): Promise<View | null> {
		const viewExist = await this.checkViewExistence(input);
		return viewExist ? null : this.viewModel.create(input);
	}

	private async checkViewExistence(input: ViewInput): Promise<View | null> {
		const { memberId, viewRefId, viewGroup } = input;
		return this.viewModel.findOne({ memberId, viewRefId, viewGroup }).exec();
	}

	public async getVisitedProducts(memberId: ObjectId, input: OrdinaryInquiry): Promise<Products> {
		const data: T = await this.viewModel
			.aggregate([
				{ $match: { viewGroup: ViewGroup.PRODUCT, memberId } },
				{ $sort: { updatedAt: -1 } },
				{
					$lookup: {
						from: 'products',
						localField: 'viewRefId',
						foreignField: '_id',
						as: 'visitedProduct',
					},
				},
				{ $unwind: '$visitedProduct' },
				{ $match: { 'visitedProduct.productStatus': ProductStatus.ACTIVE } },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupVisitedProduct,
							{ $unwind: '$visitedProduct.memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();

		return {
			list: data[0].list.map((element) => element.visitedProduct),
			metaCounter: data[0].metaCounter,
		};
	}
}
