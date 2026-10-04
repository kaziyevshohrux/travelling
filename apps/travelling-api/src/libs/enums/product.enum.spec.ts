import {
	ProductBookingType,
	ProductCategory,
	ProductPriceUnit,
	ProductRegion,
	ProductStatus,
	ProductType,
} from './product.enum';

describe('product enums', () => {
	it('exposes the approved product contract exactly', () => {
		expect(Object.values(ProductType)).toEqual(['HOTEL', 'TOUR', 'ACTIVITY', 'TRANSPORT', 'RESTAURANT']);
		expect(Object.values(ProductCategory)).toEqual(['ADVENTURE', 'CULTURE', 'FOOD', 'NATURE', 'RELAXATION', 'FAMILY']);
		expect(Object.values(ProductStatus)).toEqual(['ACTIVE', 'INACTIVE', 'SOLD_OUT', 'DELETE']);
		expect(Object.values(ProductRegion)).toEqual(['SEOUL', 'BUSAN', 'JEJU', 'INCHEON', 'DAEGU', 'OTHER']);
		expect(Object.values(ProductBookingType)).toEqual(['INSTANT', 'REQUEST']);
		expect(Object.values(ProductPriceUnit)).toEqual(['PER_PERSON', 'PER_NIGHT', 'PER_BOOKING']);
	});
});
