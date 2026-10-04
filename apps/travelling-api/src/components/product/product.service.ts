import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { lookupAuthMemberLiked, lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { Product, Products } from '../../libs/dto/product/product';
import {
	AgentProductsInquiry,
	AllProductsInquiry,
	OrdinaryInquiry,
	ProductInput,
	ProductsInquiry,
} from '../../libs/dto/product/product.input';
import { ProductUpdate } from '../../libs/dto/product/product.update';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { ProductStatus } from '../../libs/enums/product.enum';
import { ViewGroup } from '../../libs/enums/view.enum';
import { Direction, Message, StatisticModifier, T } from '../../libs/types/common';
import { LikeService } from '../like/like.service';
import { MemberService } from '../member/member.service';
import { ViewService } from '../view/view.service';

@Injectable()
export class ProductService {
	constructor(
		@InjectModel('Product') private readonly productModel: Model<Product>,
		private readonly memberService: MemberService,
		private readonly viewService: ViewService,
		private readonly likeService: LikeService,
	) {}

	public async createProduct(input: ProductInput): Promise<Product> {
		input.productCurrency ??= 'KRW';
		try {
			const result = await this.productModel.create(input);
			await this.memberService.memberStatsEditor({ _id: result.memberId, targetKey: 'memberProducts', modifier: 1 });
			return result;
		} catch (error) {
			throw new BadRequestException(Message.CREATE_FAILED);
		}
	}

	public async getProduct(memberId: ObjectId | null, productId: ObjectId): Promise<Product> {
		const targetProduct = (await this.productModel
			.findOne({ _id: productId, productStatus: ProductStatus.ACTIVE })
			.lean()
			.exec()) as Product | null;
		if (!targetProduct) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		if (memberId) {
			const newView = await this.viewService.recordView({
				memberId,
				viewRefId: productId,
				viewGroup: ViewGroup.PRODUCT,
			});
			if (newView) {
				await this.productStatsEditor({ _id: productId, targetKey: 'productViews', modifier: 1 });
				targetProduct.productViews++;
			}
			targetProduct.meLiked = await this.likeService.checkLikeExistence({
				memberId,
				likeRefId: productId,
				likeGroup: LikeGroup.PRODUCT,
			});
		}

		targetProduct.memberData = await this.memberService.getMember(null, targetProduct.memberId);
		return targetProduct;
	}

	public async productStatsEditor(input: StatisticModifier): Promise<Product> {
		const { _id, targetKey, modifier } = input;
		const result = await this.productModel
			.findByIdAndUpdate(_id, { $inc: { [targetKey]: modifier } }, { new: true })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result;
	}

	public async updateProduct(memberId: ObjectId, input: ProductUpdate): Promise<Product> {
		return this.updateProductRecord(input, memberId);
	}

	private async updateProductRecord(input: ProductUpdate, memberId?: ObjectId): Promise<Product> {
		const { _id, deletedAt: _ignoredDeletedAt, ...changes } = input;
		const deleting = changes.productStatus === ProductStatus.DELETE;
		const search: T = { _id, productStatus: { $ne: ProductStatus.DELETE } };
		if (memberId) search.memberId = memberId;

		const update: T = deleting ? { ...changes, deletedAt: new Date() } : changes;
		const result = await this.productModel.findOneAndUpdate(search, update, { new: true }).exec();
		if (!result) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		if (deleting) {
			await this.memberService.memberStatsEditor({
				_id: result.memberId,
				targetKey: 'memberProducts',
				modifier: -1,
			});
		}
		return result;
	}

	public async getProducts(memberId: ObjectId | null, input: ProductsInquiry): Promise<Products> {
		const match: T = { productStatus: ProductStatus.ACTIVE };
		const sort: T = { [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC };
		this.shapeMatchQuery(match, input);

		const result = await this.productModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupAuthMemberLiked(memberId, '$_id', LikeGroup.PRODUCT),
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	private shapeMatchQuery(match: T, input: ProductsInquiry): void {
		const { memberId, regionList, typeList, categoryList, bookingTypeList, pricesRange, periodsRange, text } = input.search;
		if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);
		if (regionList?.length) match.productRegion = { $in: regionList };
		if (typeList?.length) match.productType = { $in: typeList };
		if (categoryList?.length) match.productCategory = { $in: categoryList };
		if (bookingTypeList?.length) match.productBookingType = { $in: bookingTypeList };
		if (pricesRange) match.productPrice = { $gte: pricesRange.start, $lte: pricesRange.end };
		if (periodsRange) match.createdAt = { $gte: periodsRange.start, $lte: periodsRange.end };
		if (text) match.productTitle = { $regex: new RegExp(text, 'i') };
	}

	public async getFavorites(memberId: ObjectId, input: OrdinaryInquiry): Promise<Products> {
		return this.likeService.getFavoriteProducts(memberId, input);
	}

	public async getVisited(memberId: ObjectId, input: OrdinaryInquiry): Promise<Products> {
		return this.viewService.getVisitedProducts(memberId, input);
	}

	public async getAgentProducts(memberId: ObjectId, input: AgentProductsInquiry): Promise<Products> {
		const { productStatus } = input.search;
		if (productStatus === ProductStatus.DELETE) throw new BadRequestException(Message.NOT_ALLOWED_REQUEST);

		const match: T = {
			memberId,
			productStatus: productStatus ?? { $ne: ProductStatus.DELETE },
		};
		const sort: T = { [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC };
		const result = await this.productModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async likeTargetProduct(memberId: ObjectId, likeRefId: ObjectId): Promise<Product> {
		const target = await this.productModel
			.findOne({ _id: likeRefId, productStatus: ProductStatus.ACTIVE })
			.exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = { memberId, likeRefId, likeGroup: LikeGroup.PRODUCT };
		const modifier = await this.likeService.toggleLike(input);
		return this.productStatsEditor({ _id: likeRefId, targetKey: 'productLikes', modifier });
	}

	public async getAllProductsByAdmin(input: AllProductsInquiry): Promise<Products> {
		const {
			memberId,
			productStatus,
			productRegionList,
			productTypeList,
			productCategoryList,
			productBookingTypeList,
			pricesRange,
			periodsRange,
			text,
		} = input.search;
		const match: T = {};
		if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);
		if (productStatus) match.productStatus = productStatus;
		if (productRegionList?.length) match.productRegion = { $in: productRegionList };
		if (productTypeList?.length) match.productType = { $in: productTypeList };
		if (productCategoryList?.length) match.productCategory = { $in: productCategoryList };
		if (productBookingTypeList?.length) match.productBookingType = { $in: productBookingTypeList };
		if (pricesRange) match.productPrice = { $gte: pricesRange.start, $lte: pricesRange.end };
		if (periodsRange) match.createdAt = { $gte: periodsRange.start, $lte: periodsRange.end };
		if (text) match.productTitle = { $regex: new RegExp(text, 'i') };

		const sort: T = { [input.sort ?? 'createdAt']: input.direction ?? Direction.DESC };
		const result = await this.productModel
			.aggregate([
				{ $match: match },
				{ $sort: sort },
				{
					$facet: {
						list: [
							{ $skip: (input.page - 1) * input.limit },
							{ $limit: input.limit },
							lookupMember,
							{ $unwind: '$memberData' },
						],
						metaCounter: [{ $count: 'total' }],
					},
				},
			])
			.exec();
		if (!result.length) throw new InternalServerErrorException(Message.NO_DATA_FOUND);
		return result[0];
	}

	public async updateProductByAdmin(input: ProductUpdate): Promise<Product> {
		return this.updateProductRecord(input);
	}

	public async removeProductByAdmin(productId: ObjectId): Promise<Product> {
		const result = await this.productModel
			.findOneAndDelete({ _id: productId, productStatus: ProductStatus.DELETE })
			.exec();
		if (!result) throw new InternalServerErrorException(Message.REMOVE_FAILED);
		return result;
	}
}
