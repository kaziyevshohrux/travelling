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
		productModel = { create: jest.fn(), findOneAndUpdate: jest.fn() };
		memberService = { memberStatsEditor: jest.fn().mockResolvedValue(undefined) };
		likeService = { getFavoriteProducts: jest.fn() };
		viewService = { getVisitedProducts: jest.fn() };
		service = new ProductService(productModel as never, memberService as never, viewService as never, likeService as never);
	});

	it('defaults currency and increments memberProducts when creating', async () => {
		productModel.create.mockImplementation(async (value) => ({ ...value, _id: productId }));
		const createInput = input();

		await service.createProduct(createInput);

		expect(createInput.productCurrency).toBe('KRW');
		expect(memberService.memberStatsEditor).toHaveBeenCalledWith({
			_id: memberId,
			targetKey: 'memberProducts',
			modifier: 1,
		});
	});

	it('logically deletes once and prevents a duplicate decrement', async () => {
		const exec = jest.fn().mockResolvedValueOnce({ _id: productId, memberId }).mockResolvedValueOnce(null);
		productModel.findOneAndUpdate.mockReturnValue({ exec });

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

		(service as unknown as { shapeMatchQuery(target: Record<string, unknown>, input: ProductsInquiry): void })
			.shapeMatchQuery(match, inquiry);

		expect(match).toEqual({
			memberId,
			productRegion: { $in: [ProductRegion.JEJU] },
			productType: { $in: [ProductType.ACTIVITY] },
			productCategory: { $in: [ProductCategory.ADVENTURE] },
			productBookingType: { $in: [ProductBookingType.REQUEST] },
			productPrice: { $gte: 10, $lte: 100 },
			productTitle: { $regex: expect.any(RegExp) },
		});
	});

	it('allows non-terminal status changes without decrementing the owner counter', async () => {
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
