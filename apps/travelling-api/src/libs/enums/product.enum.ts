import { registerEnumType } from '@nestjs/graphql';

export enum ProductType {
	HOTEL = 'HOTEL',
	TOUR = 'TOUR',
	ACTIVITY = 'ACTIVITY',
	TRANSPORT = 'TRANSPORT',
	RESTAURANT = 'RESTAURANT',
}
registerEnumType(ProductType, { name: 'ProductType' });

export enum ProductCategory {
	ADVENTURE = 'ADVENTURE',
	CULTURE = 'CULTURE',
	FOOD = 'FOOD',
	NATURE = 'NATURE',
	RELAXATION = 'RELAXATION',
	FAMILY = 'FAMILY',
}
registerEnumType(ProductCategory, { name: 'ProductCategory' });

export enum ProductStatus {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	SOLD_OUT = 'SOLD_OUT',
	DELETE = 'DELETE',
}
registerEnumType(ProductStatus, { name: 'ProductStatus' });

export enum ProductRegion {
	SEOUL = 'SEOUL',
	BUSAN = 'BUSAN',
	JEJU = 'JEJU',
	INCHEON = 'INCHEON',
	DAEGU = 'DAEGU',
	OTHER = 'OTHER',
}
registerEnumType(ProductRegion, { name: 'ProductRegion' });

export enum ProductBookingType {
	INSTANT = 'INSTANT',
	REQUEST = 'REQUEST',
}
registerEnumType(ProductBookingType, { name: 'ProductBookingType' });

export enum ProductPriceUnit {
	PER_PERSON = 'PER_PERSON',
	PER_NIGHT = 'PER_NIGHT',
	PER_BOOKING = 'PER_BOOKING',
}
registerEnumType(ProductPriceUnit, { name: 'ProductPriceUnit' });
