import {
	ProductBookingType,
	ProductCategory,
	ProductPriceUnit,
	ProductRegion,
	ProductStatus,
	ProductType,
} from './product.enum';

describe('product enums', () => {
	it('adds travel search values without dropping stored-data compatibility values', () => {
		expect(Object.values(ProductType)).toEqual(['HOTEL', 'TOUR', 'ACTIVITY', 'TRANSFER', 'TRANSPORT', 'RESTAURANT']);
		expect(Object.values(ProductCategory)).toEqual([
			'ADVENTURE',
			'CULTURE',
			'FOOD',
			'NATURE',
			'WELLNESS',
			'CITY_EXPLORATION',
			'RELAXATION',
			'FAMILY',
		]);
		expect(Object.values(ProductStatus)).toEqual(['ACTIVE', 'INACTIVE', 'SOLD_OUT', 'DELETE']);
		expect(Object.values(ProductRegion)).toEqual(['SEOUL', 'BUSAN', 'JEJU', 'INCHEON', 'DAEGU', 'OTHER']);
		expect(Object.values(ProductBookingType)).toEqual(['INSTANT', 'REQUEST']);
		expect(Object.values(ProductPriceUnit)).toEqual(['PER_PERSON', 'PER_NIGHT', 'PER_BOOKING']);
	});
});
