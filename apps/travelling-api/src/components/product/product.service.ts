import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { lookupAuthMemberLiked, lookupMember, shapeIntoMongoObjectId } from '../../libs/config';
import { Product, ProductPriceQuote, Products } from '../../libs/dto/product/product';
import {
	AgentProductsInquiry,
	AllProductsInquiry,
	OrdinaryInquiry,
	ProductAvailabilityInput,
	ProductAvailabilityUpdateInput,
	ProductInput,
	ProductQuoteInput,
	ProductsInquiry,
} from '../../libs/dto/product/product.input';
import { ProductUpdate } from '../../libs/dto/product/product.update';
import { LikeInput } from '../../libs/dto/like/like.input';
import { LikeGroup } from '../../libs/enums/like.enum';
import { ProductPriceUnit, ProductRegion, ProductStatus, ProductType } from '../../libs/enums/product.enum';
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
		input.productCategories ??= [input.productCategory];
		this.validateProductConfiguration(input, true);
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

	public async updateProductAvailability(memberId: ObjectId, input: ProductAvailabilityUpdateInput): Promise<Product> {
		return this.updateProductRecord({ _id: input.productId, productAvailability: input.productAvailability }, memberId);
	}

	private async updateProductRecord(input: ProductUpdate, memberId?: ObjectId): Promise<Product> {
		const { _id, deletedAt: _ignoredDeletedAt, ...changes } = input;
		const deleting = changes.productStatus === ProductStatus.DELETE;
		const search: T = { _id, productStatus: { $ne: ProductStatus.DELETE } };
		if (memberId) search.memberId = memberId;

		const existing = await this.productModel.findOne(search).lean().exec();
		if (!existing) throw new InternalServerErrorException(Message.UPDATE_FAILED);

		const update: T = deleting ? { ...changes, deletedAt: new Date() } : changes;
		if (!deleting) {
			const candidate = { ...existing, ...changes } as Product;
			const strictAvailability = changes.productAvailability !== undefined || changes.productType !== undefined;
			this.validateProductConfiguration(candidate, strictAvailability);
		}
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

	public async getProductPriceQuote(input: ProductQuoteInput): Promise<ProductPriceQuote> {
		this.validateTravelSelection(input);
		const product = (await this.productModel
			.findOne({ _id: input.productId, productStatus: ProductStatus.ACTIVE })
			.lean()
			.exec()) as Product | null;
		if (!product) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		this.validateTravelSelection(input, product.productType);
		this.validateGuestSuitability(product, input.adults, input.childrenAges ?? []);
		if (!this.hasAvailableInventory(product, input)) {
			throw new BadRequestException('The selected dates do not have sufficient published inventory');
		}

		const guestCount = input.adults + (input.childrenAges?.length ?? 0);
		const nights = this.getUtcHotelNights(input.startDate, input.endDate).length;
		let quantity = 1;
		if (product.productPriceUnit === ProductPriceUnit.PER_PERSON) quantity = guestCount;
		if (product.productPriceUnit === ProductPriceUnit.PER_NIGHT) {
			if (product.productType !== ProductType.HOTEL) {
				throw new BadRequestException('PER_NIGHT pricing is only supported for HOTEL products');
			}
			quantity = nights * (input.rooms ?? 1);
		}

		const amount = product.productPrice * quantity;
		return {
			productId: product._id,
			currency: product.productCurrency,
			priceUnit: product.productPriceUnit,
			unitPrice: product.productPrice,
			quantity,
			subtotal: amount,
			total: amount,
			inventoryAvailable: true,
			breakdown: [{ label: 'BASE_PRICE', unitPrice: product.productPrice, quantity, amount }],
			disclaimer: 'This quote uses configured base pricing only and does not reserve inventory.',
		};
	}

	public async getProducts(memberId: ObjectId | null, input: ProductsInquiry): Promise<Products> {
		this.validateProductsInquiry(input);
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
		const {
			memberId,
			regionList,
			productLocation,
			typeList,
			productType,
			categoryList,
			productCategories,
			bookingTypeList,
			pricesRange,
			periodsRange,
			startDate,
			endDate,
			adults,
			childrenAges,
			rooms,
			text,
		} = input.search;
		if (memberId) match.memberId = shapeIntoMongoObjectId(memberId);
		if (regionList?.length) match.productRegion = { $in: regionList };
		if (productLocation) {
			const escapedLocation = productLocation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const locationOptions: T[] = [{ productAddress: { $regex: escapedLocation, $options: 'i' } }];
			const normalizedRegion = productLocation.trim().toUpperCase();
			if (Object.values(ProductRegion).includes(normalizedRegion as ProductRegion)) {
				locationOptions.push({ productRegion: normalizedRegion });
			}
			this.addMatchClause(match, { $or: locationOptions });
		}
		if (typeList?.length) match.productType = { $in: typeList };
		if (productType) this.addMatchClause(match, { productType });
		if (categoryList?.length) this.addCategoryMatch(match, categoryList);
		if (productCategories?.length) this.addCategoryMatch(match, productCategories);
		if (bookingTypeList?.length) match.productBookingType = { $in: bookingTypeList };
		if (pricesRange) match.productPrice = { $gte: pricesRange.start, $lte: pricesRange.end };
		if (periodsRange) match.createdAt = { $gte: periodsRange.start, $lte: periodsRange.end };
		if (text) match.productTitle = { $regex: new RegExp(text, 'i') };

		const guestCount = (adults ?? 0) + (childrenAges?.length ?? 0);
		if (guestCount > 0) match.productMaxGuests = { $gte: guestCount };
		if (childrenAges?.length) {
			const youngestChild = Math.min(...childrenAges);
			const oldestChild = Math.max(...childrenAges);
			this.addMatchClause(match, {
				$or: [{ productMinChildAge: { $exists: false } }, { productMinChildAge: { $lte: youngestChild } }],
			});
			this.addMatchClause(match, {
				$or: [{ productMaxChildAge: { $exists: false } }, { productMaxChildAge: { $gte: oldestChild } }],
			});
		}

		if (startDate && endDate) {
			this.addAvailabilityMatch(match, startDate, endDate, rooms ?? 1, Math.max(guestCount, 1));
		}
	}

	private addCategoryMatch(match: T, categories: unknown[]): void {
		this.addMatchClause(match, {
			$or: [{ productCategories: { $in: categories } }, { productCategory: { $in: categories } }],
		});
	}

	private addMatchClause(match: T, clause: T): void {
		match.$and ??= [];
		match.$and.push(clause);
	}

	private addAvailabilityMatch(match: T, startDate: Date, endDate: Date, rooms: number, passengers: number): void {
		const hotelNights = this.getUtcHotelNights(startDate, endDate);
		const datedSeatAvailability = {
			$elemMatch: {
				availabilityDate: { $gte: startDate, $lt: endDate },
				remainingSeats: { $gte: passengers },
			},
		};

		const availabilityOptions: T[] = [];
		if (hotelNights.length) {
			availabilityOptions.push({
				productType: ProductType.HOTEL,
				productAvailability: {
					$all: hotelNights.map((availabilityDate) => ({
						$elemMatch: { availabilityDate, isBlocked: { $ne: true }, remainingRooms: { $gte: rooms } },
					})),
				},
			});
		}
		availabilityOptions.push({
			productType: { $in: [ProductType.TOUR, ProductType.ACTIVITY, ProductType.TRANSFER] },
			productAvailability: {
				$elemMatch: { ...datedSeatAvailability.$elemMatch, isBlocked: { $ne: true } },
			},
		});

		this.addMatchClause(match, {
			$or: availabilityOptions,
		});
	}

	private getUtcHotelNights(startDate: Date, endDate: Date): Date[] {
		const cursor = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
		const checkout = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()));
		const nights: Date[] = [];
		while (cursor < checkout) {
			nights.push(new Date(cursor));
			cursor.setUTCDate(cursor.getUTCDate() + 1);
		}
		return nights;
	}

	private validateProductsInquiry(input: ProductsInquiry): void {
		const { page, limit, search } = input;
		if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
			throw new BadRequestException('Page and limit must be positive integers');
		}

		const { adults, childrenAges, rooms, startDate, endDate, productType, typeList, pricesRange } = search;
		if (adults !== undefined && (!Number.isInteger(adults) || adults < 1)) {
			throw new BadRequestException('Adults must be an integer greater than or equal to 1');
		}
		if (childrenAges?.some((age) => !Number.isInteger(age) || age < 0)) {
			throw new BadRequestException('Children ages must be non-negative integers');
		}
		if (rooms !== undefined && (!Number.isInteger(rooms) || rooms < 1)) {
			throw new BadRequestException('Rooms must be an integer greater than or equal to 1');
		}
		if (rooms !== undefined && !this.isHotelOnlySearch(productType, typeList)) {
			throw new BadRequestException('Rooms can only be used when searching HOTEL products');
		}
		if (pricesRange && pricesRange.start > pricesRange.end) {
			throw new BadRequestException('Minimum price cannot be greater than maximum price');
		}

		const hasStartDate = startDate !== undefined;
		const hasEndDate = endDate !== undefined;
		if (hasStartDate !== hasEndDate) {
			throw new BadRequestException('Start date and end date must be provided together');
		}
		if (hasStartDate && hasEndDate) {
			if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
				throw new BadRequestException('Start date and end date must be valid dates');
			}
			if (endDate <= startDate) {
				throw new BadRequestException('End date must be later than start date');
			}
			if (this.isHotelOnlySearch(productType, typeList) && this.getUtcHotelNights(startDate, endDate).length === 0) {
				throw new BadRequestException('HOTEL check-out date must be later than check-in date in UTC');
			}
		}
	}

	private isHotelOnlySearch(productType?: ProductType, typeList?: ProductType[]): boolean {
		if (productType)
			return productType === ProductType.HOTEL && (!typeList?.length || typeList.includes(ProductType.HOTEL));
		return typeList?.length === 1 && typeList[0] === ProductType.HOTEL;
	}

	private isValidDate(value: unknown): value is Date {
		return value instanceof Date && !Number.isNaN(value.getTime());
	}

	private validateProductConfiguration(product: T, strictAvailability: boolean): void {
		if (product.productCategories) {
			const categories = product.productCategories as string[];
			if (new Set(categories).size !== categories.length) {
				throw new BadRequestException('Product categories must not contain duplicates');
			}
		}
		if (
			product.productMinChildAge !== undefined &&
			product.productMaxChildAge !== undefined &&
			product.productMinChildAge > product.productMaxChildAge
		) {
			throw new BadRequestException('Minimum child age cannot be greater than maximum child age');
		}

		const availability = (product.productAvailability ?? []) as ProductAvailabilityInput[];
		if (!availability.length) return;
		if (strictAvailability && product.productMaxGuests === undefined) {
			throw new BadRequestException('Products with availability must define productMaxGuests');
		}
		if (
			![ProductType.HOTEL, ProductType.TOUR, ProductType.ACTIVITY, ProductType.TRANSFER].includes(product.productType)
		) {
			throw new BadRequestException('Availability is not supported for this product type');
		}

		const seenDates = new Set<number>();
		for (const entry of availability) {
			if (!this.isValidDate(entry.availabilityDate)) {
				throw new BadRequestException('Availability dates must be valid UTC dates');
			}
			const timestamp = entry.availabilityDate.getTime();
			if (seenDates.has(timestamp)) throw new BadRequestException('Duplicate availability dates are not allowed');
			seenDates.add(timestamp);

			if (entry.availabilityEnd !== undefined) {
				if (!this.isValidDate(entry.availabilityEnd) || entry.availabilityEnd <= entry.availabilityDate) {
					throw new BadRequestException('Availability end must be later than availability date');
				}
			}

			if (product.productType === ProductType.HOTEL) {
				if (
					entry.availabilityDate.getUTCHours() !== 0 ||
					entry.availabilityDate.getUTCMinutes() !== 0 ||
					entry.availabilityDate.getUTCSeconds() !== 0 ||
					entry.availabilityDate.getUTCMilliseconds() !== 0
				) {
					throw new BadRequestException('HOTEL availability dates must be UTC midnight');
				}
				if (
					entry.availabilityEnd !== undefined ||
					entry.capacitySeats !== undefined ||
					entry.remainingSeats !== undefined
				) {
					throw new BadRequestException('HOTEL availability cannot contain slot or seat fields');
				}
				this.validateInventoryValues(
					entry.capacityRooms,
					entry.remainingRooms,
					entry.isBlocked ?? false,
					strictAvailability,
					'room',
				);
			} else {
				if (entry.capacityRooms !== undefined || entry.remainingRooms !== undefined) {
					throw new BadRequestException('TOUR, ACTIVITY, and TRANSFER availability cannot contain room fields');
				}
				if (strictAvailability && entry.availabilityEnd === undefined) {
					throw new BadRequestException('TOUR, ACTIVITY, and TRANSFER availability requires a slot end');
				}
				this.validateInventoryValues(
					entry.capacitySeats,
					entry.remainingSeats,
					entry.isBlocked ?? false,
					strictAvailability,
					'seat',
				);
			}
		}
	}

	private validateInventoryValues(
		capacity: number | undefined,
		remaining: number | undefined,
		isBlocked: boolean,
		strict: boolean,
		unit: 'room' | 'seat',
	): void {
		if (isBlocked && remaining !== undefined && remaining > 0) {
			throw new BadRequestException(`Blocked availability cannot publish remaining ${unit}s`);
		}
		if (!isBlocked && strict && (capacity === undefined || remaining === undefined)) {
			throw new BadRequestException(`Published availability requires ${unit} capacity and remaining ${unit}s`);
		}
		if (capacity !== undefined && remaining !== undefined && remaining > capacity) {
			throw new BadRequestException(`Remaining ${unit}s cannot exceed configured ${unit} capacity`);
		}
	}

	private validateTravelSelection(input: ProductQuoteInput, productType?: ProductType): void {
		if (!this.isValidDate(input.startDate) || !this.isValidDate(input.endDate) || input.endDate <= input.startDate) {
			throw new BadRequestException('Quote dates must be valid and endDate must be later than startDate');
		}
		if (!Number.isInteger(input.adults) || input.adults < 1) {
			throw new BadRequestException('Adults must be an integer greater than or equal to 1');
		}
		if (input.childrenAges?.some((age) => !Number.isInteger(age) || age < 0)) {
			throw new BadRequestException('Children ages must be non-negative integers');
		}
		if (input.rooms !== undefined && (!Number.isInteger(input.rooms) || input.rooms < 1)) {
			throw new BadRequestException('Rooms must be an integer greater than or equal to 1');
		}
		if (productType && input.rooms !== undefined && productType !== ProductType.HOTEL) {
			throw new BadRequestException('Rooms can only be used for HOTEL quotes');
		}
		if (productType === ProductType.HOTEL && this.getUtcHotelNights(input.startDate, input.endDate).length === 0) {
			throw new BadRequestException('HOTEL check-out date must be later than check-in date in UTC');
		}
	}

	private validateGuestSuitability(product: Product, adults: number, childrenAges: number[]): void {
		const guestCount = adults + childrenAges.length;
		if (product.productMaxGuests === undefined || guestCount > product.productMaxGuests) {
			throw new BadRequestException('The selected party exceeds or lacks configured guest suitability');
		}
		if (childrenAges.length && product.productMinChildAge !== undefined) {
			if (Math.min(...childrenAges) < product.productMinChildAge) {
				throw new BadRequestException('A child is younger than the configured minimum age');
			}
		}
		if (childrenAges.length && product.productMaxChildAge !== undefined) {
			if (Math.max(...childrenAges) > product.productMaxChildAge) {
				throw new BadRequestException('A child is older than the configured maximum child age');
			}
		}
	}

	private hasAvailableInventory(product: Product, input: ProductQuoteInput): boolean {
		const availability = product.productAvailability ?? [];
		if (product.productType === ProductType.HOTEL) {
			const rooms = input.rooms ?? 1;
			return this.getUtcHotelNights(input.startDate, input.endDate).every((night) =>
				availability.some(
					(entry) =>
						entry.availabilityDate.getTime() === night.getTime() &&
						entry.isBlocked !== true &&
						(entry.remainingRooms ?? 0) >= rooms,
				),
			);
		}
		if ([ProductType.TOUR, ProductType.ACTIVITY, ProductType.TRANSFER].includes(product.productType)) {
			const passengers = input.adults + (input.childrenAges?.length ?? 0);
			return availability.some(
				(entry) =>
					entry.availabilityDate >= input.startDate &&
					entry.availabilityDate < input.endDate &&
					entry.isBlocked !== true &&
					(entry.remainingSeats ?? 0) >= passengers,
			);
		}
		return false;
	}

	public async getFavorites(memberId: ObjectId, input: OrdinaryInquiry): Promise<Products> {
		this.validatePagination(input.page, input.limit);
		return this.likeService.getFavoriteProducts(memberId, input);
	}

	public async getVisited(memberId: ObjectId, input: OrdinaryInquiry): Promise<Products> {
		this.validatePagination(input.page, input.limit);
		return this.viewService.getVisitedProducts(memberId, input);
	}

	public async getAgentProducts(memberId: ObjectId, input: AgentProductsInquiry): Promise<Products> {
		this.validatePagination(input.page, input.limit);
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
		const target = await this.productModel.findOne({ _id: likeRefId, productStatus: ProductStatus.ACTIVE }).exec();
		if (!target) throw new InternalServerErrorException(Message.NO_DATA_FOUND);

		const input: LikeInput = { memberId, likeRefId, likeGroup: LikeGroup.PRODUCT };
		const modifier = await this.likeService.toggleLike(input);
		return this.productStatsEditor({ _id: likeRefId, targetKey: 'productLikes', modifier });
	}

	public async getAllProductsByAdmin(input: AllProductsInquiry): Promise<Products> {
		this.validatePagination(input.page, input.limit);
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
		if (productCategoryList?.length) this.addCategoryMatch(match, productCategoryList);
		if (productBookingTypeList?.length) match.productBookingType = { $in: productBookingTypeList };
		if (pricesRange) match.productPrice = { $gte: pricesRange.start, $lte: pricesRange.end };
		if (pricesRange && pricesRange.start > pricesRange.end) {
			throw new BadRequestException('Minimum price cannot be greater than maximum price');
		}
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

	private validatePagination(page: number, limit: number): void {
		if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
			throw new BadRequestException('Page and limit must be positive integers');
		}
	}
}
