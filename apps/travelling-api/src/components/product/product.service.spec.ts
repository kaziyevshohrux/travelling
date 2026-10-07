import { Types } from 'mongoose';
import {
	ProductBookingType,
	ProductCategory,
	ProductPriceUnit,
	ProductRegion,
	ProductStatus,
	ProductType,
} from '../../libs/enums/product.enum';
import { ProductInput, ProductsInquiry } from '../../libs/dto/product/product.input';
import { ProductService } from './product.service';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }));

describe('ProductService', () => {
	const memberId = new Types.ObjectId();
	const productId = new Types.ObjectId();
	let productModel: Record<string, jest.Mock>;
	let memberService: { memberStatsEditor: jest.Mock };
	let likeService: { getFavoriteProducts: jest.Mock };
	let viewService: { getVisitedProducts: jest.Mock };
	let service: ProductService;

	const input = (): ProductInput => ({
		productType: ProductType.TOUR,
		productCategory: ProductCategory.CULTURE,
		productRegion: ProductRegion.SEOUL,
		productAddress: 'Seoul center',
		productTitle: 'City walking tour',
		productPrice: 50,
		productPriceUnit: ProductPriceUnit.PER_PERSON,
		productBookingType: ProductBookingType.INSTANT,
		productImages: ['tour.jpg'],
		memberId,
	});

	beforeEach(() => {
		productModel = { aggregate: jest.fn(), create: jest.fn(), findOne: jest.fn(), findOneAndUpdate: jest.fn() };
		memberService = { memberStatsEditor: jest.fn().mockResolvedValue(undefined) };
		likeService = { getFavoriteProducts: jest.fn() };
		viewService = { getVisitedProducts: jest.fn() };
		service = new ProductService(
			productModel as never,
			memberService as never,
			viewService as never,
			likeService as never,
		);
	});

	it('defaults currency and increments memberProducts when creating', async () => {
		productModel.create.mockImplementation(async (value) => ({ ...value, _id: productId }));
		const createInput = input();

		await service.createProduct(createInput);

		expect(createInput.productCurrency).toBe('KRW');
		expect(createInput.productCategories).toEqual([ProductCategory.CULTURE]);
		expect(memberService.memberStatsEditor).toHaveBeenCalledWith({
			_id: memberId,
			targetKey: 'memberProducts',
			modifier: 1,
		});
	});

	it('logically deletes once and prevents a duplicate decrement', async () => {
		const findExec = jest.fn().mockResolvedValueOnce({ _id: productId, memberId }).mockResolvedValueOnce(null);
		productModel.findOne.mockReturnValue({ lean: () => ({ exec: findExec }) });
		productModel.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: productId, memberId }) });

		await service.updateProduct(memberId, { _id: productId, productStatus: ProductStatus.DELETE });
		await expect(
			service.updateProduct(memberId, { _id: productId, productStatus: ProductStatus.DELETE }),
		).rejects.toThrow();

		expect(productModel.findOneAndUpdate).toHaveBeenCalledWith(
			{ _id: productId, productStatus: { $ne: ProductStatus.DELETE }, memberId },
			expect.objectContaining({ productStatus: ProductStatus.DELETE, deletedAt: expect.any(Date) }),
			{ new: true },
		);
		expect(memberService.memberStatsEditor).toHaveBeenCalledTimes(1);
	});

	it('maps product filters without real-estate fields', () => {
		const match: Record<string, unknown> = {};
		const inquiry = {
			page: 1,
			limit: 10,
			search: {
				memberId,
				regionList: [ProductRegion.JEJU],
				typeList: [ProductType.ACTIVITY],
				categoryList: [ProductCategory.ADVENTURE],
				bookingTypeList: [ProductBookingType.REQUEST],
				pricesRange: { start: 10, end: 100 },
				text: 'hike',
			},
		} as ProductsInquiry;

		(
			service as unknown as { shapeMatchQuery(target: Record<string, unknown>, input: ProductsInquiry): void }
		).shapeMatchQuery(match, inquiry);

		expect(match).toEqual({
			memberId,
			productRegion: { $in: [ProductRegion.JEJU] },
			productType: { $in: [ProductType.ACTIVITY] },
			productBookingType: { $in: [ProductBookingType.REQUEST] },
			productPrice: { $gte: 10, $lte: 100 },
			productTitle: { $regex: expect.any(RegExp) },
			$and: [
				{
					$or: [
						{ productCategories: { $in: [ProductCategory.ADVENTURE] } },
						{ productCategory: { $in: [ProductCategory.ADVENTURE] } },
					],
				},
			],
		});
	});

	it('requires guest suitability and inventory evidence for every HOTEL night', () => {
		const match: Record<string, any> = {};
		const inquiry = {
			page: 1,
			limit: 10,
			search: {
				productType: ProductType.HOTEL,
				productCategories: [ProductCategory.NATURE, ProductCategory.WELLNESS],
				startDate: new Date('2026-12-10T00:00:00.000Z'),
				endDate: new Date('2026-12-12T00:00:00.000Z'),
				adults: 2,
				childrenAges: [4, 10],
				rooms: 2,
			},
		} as ProductsInquiry;

		(
			service as unknown as { shapeMatchQuery(target: Record<string, unknown>, input: ProductsInquiry): void }
		).shapeMatchQuery(match, inquiry);

		expect(match.productMaxGuests).toEqual({ $gte: 4 });
		const availabilityClause = match.$and.find((clause: any) =>
			clause.$or?.some((option: any) => option.productType === ProductType.HOTEL),
		);
		const hotelOption = availabilityClause.$or.find((option: any) => option.productType === ProductType.HOTEL);
		expect(hotelOption.productAvailability.$all).toHaveLength(2);
		expect(hotelOption.productAvailability.$all).toEqual([
			{
				$elemMatch: {
					availabilityDate: new Date('2026-12-10T00:00:00.000Z'),
					isBlocked: { $ne: true },
					remainingRooms: { $gte: 2 },
				},
			},
			{
				$elemMatch: {
					availabilityDate: new Date('2026-12-11T00:00:00.000Z'),
					isBlocked: { $ne: true },
					remainingRooms: { $gte: 2 },
				},
			},
		]);
	});

	it.each([
		[
			'reversed dates',
			{ productType: ProductType.HOTEL, startDate: new Date('2026-12-12'), endDate: new Date('2026-12-10') },
		],
		['invalid adults', { adults: 0 }],
		['invalid child age', { childrenAges: [-1] }],
		['rooms for a tour', { productType: ProductType.TOUR, rooms: 1 }],
		['reversed prices', { pricesRange: { start: 100, end: 10 } }],
	])('rejects %s', async (_label, search) => {
		await expect(service.getProducts(null, { page: 1, limit: 10, search } as ProductsInquiry)).rejects.toThrow();
		expect(productModel.aggregate).not.toHaveBeenCalled();
	});

	it('keeps the total count independent from pagination', async () => {
		const expected = { list: [], metaCounter: [{ total: 23 }] };
		productModel.aggregate.mockReturnValue({ exec: jest.fn().mockResolvedValue([expected]) });

		await expect(service.getProducts(null, { page: 3, limit: 5, search: {} } as ProductsInquiry)).resolves.toBe(
			expected,
		);

		const pipeline = productModel.aggregate.mock.calls[0][0];
		const facet = pipeline.find((stage: Record<string, unknown>) => '$facet' in stage).$facet;
		expect(facet.list.slice(0, 2)).toEqual([{ $skip: 10 }, { $limit: 5 }]);
		expect(facet.metaCounter).toEqual([{ $count: 'total' }]);
	});

	it('allows non-terminal status changes without decrementing the owner counter', async () => {
		productModel.findOne.mockReturnValue({
			lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: productId, memberId }) }),
		});
		const exec = jest.fn().mockResolvedValue({ _id: productId, memberId, productStatus: ProductStatus.SOLD_OUT });
		productModel.findOneAndUpdate.mockReturnValue({ exec });

		await service.updateProduct(memberId, { _id: productId, productStatus: ProductStatus.SOLD_OUT });

		expect(productModel.findOneAndUpdate).toHaveBeenCalledWith(
			{ _id: productId, productStatus: { $ne: ProductStatus.DELETE }, memberId },
			{ productStatus: ProductStatus.SOLD_OUT },
			{ new: true },
		);
		expect(memberService.memberStatsEditor).not.toHaveBeenCalled();
	});

	it('keeps AGENT ownership in both update reads and writes while ADMIN remains unrestricted', async () => {
		productModel.findOne.mockReturnValue({
			lean: () => ({ exec: jest.fn().mockResolvedValue({ _id: productId, memberId, productType: ProductType.TOUR }) }),
		});
		productModel.findOneAndUpdate.mockReturnValue({
			exec: jest.fn().mockResolvedValue({ _id: productId, memberId, productType: ProductType.TOUR }),
		});

		await service.updateProduct(memberId, { _id: productId, productTitle: 'Owned tour' });
		expect(productModel.findOne).toHaveBeenLastCalledWith({
			_id: productId,
			productStatus: { $ne: ProductStatus.DELETE },
			memberId,
		});

		await service.updateProductByAdmin({ _id: productId, productTitle: 'Admin edit' });
		expect(productModel.findOne).toHaveBeenLastCalledWith({
			_id: productId,
			productStatus: { $ne: ProductStatus.DELETE },
		});
	});

	it('rejects incompatible type-specific availability on create and type change', async () => {
		const invalidHotel = {
			...input(),
			productType: ProductType.HOTEL,
			productMaxGuests: 2,
			productAvailability: [
				{
					availabilityDate: new Date('2026-12-10T00:00:00.000Z'),
					availabilityEnd: new Date('2026-12-10T01:00:00.000Z'),
					capacitySeats: 2,
					remainingSeats: 2,
				},
			],
		};
		await expect(service.createProduct(invalidHotel)).rejects.toThrow('HOTEL availability cannot contain');
		expect(productModel.create).not.toHaveBeenCalled();

		productModel.findOne.mockReturnValue({
			lean: () => ({
				exec: jest.fn().mockResolvedValue({
					...input(),
					_id: productId,
					productMaxGuests: 4,
					productAvailability: [
						{
							availabilityDate: new Date('2026-12-10T09:00:00.000Z'),
							availabilityEnd: new Date('2026-12-10T11:00:00.000Z'),
							capacitySeats: 8,
							remainingSeats: 8,
						},
					],
				}),
			}),
		});
		await expect(service.updateProduct(memberId, { _id: productId, productType: ProductType.HOTEL })).rejects.toThrow();
		expect(productModel.findOneAndUpdate).not.toHaveBeenCalled();
	});

	it('rejects duplicate, invalid interval, and over-capacity availability updates', async () => {
		const base = { ...input(), _id: productId, productMaxGuests: 6 };
		productModel.findOne.mockReturnValue({ lean: () => ({ exec: jest.fn().mockResolvedValue(base) }) });

		const slot = {
			availabilityDate: new Date('2026-12-10T09:00:00.000Z'),
			availabilityEnd: new Date('2026-12-10T08:00:00.000Z'),
			capacitySeats: 5,
			remainingSeats: 6,
		};
		await expect(
			service.updateProductAvailability(memberId, {
				productId,
				productAvailability: [slot, { ...slot }],
			}),
		).rejects.toThrow();
		expect(productModel.findOneAndUpdate).not.toHaveBeenCalled();
	});

	it('calculates an exact configured PER_PERSON quote without discounts or fees', async () => {
		productModel.findOne.mockReturnValue({
			lean: () => ({
				exec: jest.fn().mockResolvedValue({
					_id: productId,
					productType: ProductType.TOUR,
					productStatus: ProductStatus.ACTIVE,
					productPrice: 25,
					productCurrency: 'KRW',
					productPriceUnit: ProductPriceUnit.PER_PERSON,
					productMaxGuests: 5,
					productAvailability: [
						{
							availabilityDate: new Date('2026-12-10T09:00:00.000Z'),
							availabilityEnd: new Date('2026-12-10T11:00:00.000Z'),
							capacitySeats: 5,
							remainingSeats: 4,
						},
					],
				}),
			}),
		});

		await expect(
			service.getProductPriceQuote({
				productId,
				startDate: new Date('2026-12-10T00:00:00.000Z'),
				endDate: new Date('2026-12-11T00:00:00.000Z'),
				adults: 2,
				childrenAges: [8],
			}),
		).resolves.toEqual({
			productId,
			currency: 'KRW',
			priceUnit: ProductPriceUnit.PER_PERSON,
			unitPrice: 25,
			quantity: 3,
			subtotal: 75,
			total: 75,
			inventoryAvailable: true,
			breakdown: [{ label: 'BASE_PRICE', unitPrice: 25, quantity: 3, amount: 75 }],
			disclaimer: 'This quote uses configured base pricing only and does not reserve inventory.',
		});
	});

	it('rejects blocked or insufficient quote inventory', async () => {
		productModel.findOne.mockReturnValue({
			lean: () => ({
				exec: jest.fn().mockResolvedValue({
					_id: productId,
					productType: ProductType.TRANSFER,
					productStatus: ProductStatus.ACTIVE,
					productPrice: 100,
					productCurrency: 'KRW',
					productPriceUnit: ProductPriceUnit.PER_BOOKING,
					productMaxGuests: 4,
					productAvailability: [
						{
							availabilityDate: new Date('2026-12-10T09:00:00.000Z'),
							availabilityEnd: new Date('2026-12-10T10:00:00.000Z'),
							isBlocked: true,
							capacitySeats: 4,
							remainingSeats: 0,
						},
					],
				}),
			}),
		});

		await expect(
			service.getProductPriceQuote({
				productId,
				startDate: new Date('2026-12-10T00:00:00.000Z'),
				endDate: new Date('2026-12-11T00:00:00.000Z'),
				adults: 2,
			}),
		).rejects.toThrow('sufficient published inventory');
	});

	it('delegates favorites and visits to product-only shared lookups', async () => {
		const expected = { list: [], metaCounter: [] };
		likeService.getFavoriteProducts.mockResolvedValue(expected);
		viewService.getVisitedProducts.mockResolvedValue(expected);
		const inquiry = { page: 1, limit: 10 };

		await expect(service.getFavorites(memberId, inquiry)).resolves.toBe(expected);
		await expect(service.getVisited(memberId, inquiry)).resolves.toBe(expected);
		expect(likeService.getFavoriteProducts).toHaveBeenCalledWith(memberId, inquiry);
		expect(viewService.getVisitedProducts).toHaveBeenCalledWith(memberId, inquiry);
	});
});
