import { validate } from 'class-validator';
import { ProductInput } from './product.input';
import {
	ProductBookingType,
	ProductCategory,
	ProductPriceUnit,
	ProductRegion,
	ProductType,
} from '../../enums/product.enum';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }));

const validInput = (): ProductInput =>
	Object.assign(new ProductInput(), {
		productType: ProductType.TOUR,
		productCategory: ProductCategory.CULTURE,
		productRegion: ProductRegion.SEOUL,
		productAddress: 'Seoul center',
		productTitle: 'City walking tour',
		productPrice: 10,
		productCurrency: 'KRW',
		productPriceUnit: ProductPriceUnit.PER_PERSON,
		productBookingType: ProductBookingType.INSTANT,
		productImages: ['tour.jpg'],
		productDetails: { durationHours: 4 },
	});

describe('ProductInput validation', () => {
	it('accepts the product contract', async () => {
		expect(await validate(validInput())).toEqual([]);
	});

	it('rejects a negative price and non-object details', async () => {
		const input = validInput();
		input.productPrice = -1;
		input.productDetails = [] as unknown as Record<string, unknown>;
		const errors = await validate(input);
		expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining(['productPrice', 'productDetails']));
	});
});
