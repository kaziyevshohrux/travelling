import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
	IsArray,
	IsBoolean,
	IsDate,
	IsIn,
	IsInt,
	IsNotEmpty,
	IsObject,
	IsOptional,
	IsString,
	Length,
	Matches,
	Min,
	ValidateNested,
} from 'class-validator';
import type { ObjectId } from 'mongoose';
import { availableProductSorts } from '../../config';
import {
	ProductBookingType,
	ProductCategory,
	ProductPriceUnit,
	ProductRegion,
	ProductStatus,
	ProductType,
} from '../../enums/product.enum';
import { JSONObjectScalar } from '../../scalars/json-object.scalar';
import { Direction } from '../../types/common';

@InputType()
export class ProductAvailabilityInput {
	@IsDate()
	@Field(() => Date)
	availabilityDate: Date;

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	availabilityEnd?: Date;

	@IsOptional()
	@IsBoolean()
	@Field(() => Boolean, { nullable: true, defaultValue: false })
	isBlocked?: boolean;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	capacityRooms?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	remainingRooms?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	capacitySeats?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	remainingSeats?: number;
}

@InputType()
export class ProductAvailabilityUpdateInput {
	@IsNotEmpty()
	@Field(() => String)
	productId: ObjectId;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ProductAvailabilityInput)
	@Field(() => [ProductAvailabilityInput])
	productAvailability: ProductAvailabilityInput[];
}

@InputType()
export class ProductQuoteInput {
	@IsNotEmpty()
	@Field(() => String)
	productId: ObjectId;

	@IsDate()
	@Field(() => Date)
	startDate: Date;

	@IsDate()
	@Field(() => Date)
	endDate: Date;

	@IsInt()
	@Min(1)
	@Field(() => Int)
	adults: number;

	@IsOptional()
	@IsArray()
	@IsInt({ each: true })
	@Min(0, { each: true })
	@Field(() => [Int], { nullable: true })
	childrenAges?: number[];

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	rooms?: number;
}

@InputType()
export class ProductInput {
	@IsNotEmpty()
	@Field(() => ProductType)
	productType: ProductType;

	@IsNotEmpty()
	@Field(() => ProductCategory)
	productCategory: ProductCategory;

	@IsOptional()
	@IsArray()
	@Field(() => [ProductCategory], { nullable: true })
	productCategories?: ProductCategory[];

	@IsOptional()
	@IsBoolean()
	@Field(() => Boolean, { nullable: true, defaultValue: false })
	productFamilyFriendly?: boolean;

	@IsNotEmpty()
	@Field(() => ProductRegion)
	productRegion: ProductRegion;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	productAddress: string;

	@IsNotEmpty()
	@Length(3, 100)
	@Field(() => String)
	productTitle: string;

	@Min(0)
	@Field(() => Float)
	productPrice: number;

	@IsOptional()
	@Matches(/^[A-Z]{3}$/)
	@Field(() => String, { nullable: true, defaultValue: 'KRW' })
	productCurrency?: string;

	@IsNotEmpty()
	@Field(() => ProductPriceUnit)
	productPriceUnit: ProductPriceUnit;

	@IsNotEmpty()
	@Field(() => ProductBookingType)
	productBookingType: ProductBookingType;

	@IsNotEmpty()
	@IsString({ each: true })
	@Field(() => [String])
	productImages: string[];

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	productDesc?: string;

	@IsOptional()
	@IsObject()
	@Field(() => JSONObjectScalar, { nullable: true })
	productDetails?: Record<string, unknown>;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	productMaxGuests?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	productMinChildAge?: number;

	@IsOptional()
	@IsInt()
	@Min(0)
	@Field(() => Int, { nullable: true })
	productMaxChildAge?: number;

	@IsOptional()
	@ValidateNested({ each: true })
	@Type(() => ProductAvailabilityInput)
	@Field(() => [ProductAvailabilityInput], { nullable: true })
	productAvailability?: ProductAvailabilityInput[];

	memberId?: ObjectId;
}

@InputType()
export class PricesRange {
	@Min(0)
	@Field(() => Float)
	start: number;

	@Min(0)
	@Field(() => Float)
	end: number;
}

@InputType()
export class PeriodsRange {
	@Field(() => Date)
	start: Date;

	@Field(() => Date)
	end: Date;
}

@InputType()
class ProductSearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;

	@IsOptional()
	@Field(() => [ProductRegion], { nullable: true })
	regionList?: ProductRegion[];

	@IsOptional()
	@Length(1, 100)
	@Field(() => String, { nullable: true })
	productLocation?: string;

	@IsOptional()
	@Field(() => [ProductType], { nullable: true })
	typeList?: ProductType[];

	@IsOptional()
	@Field(() => ProductType, { nullable: true })
	productType?: ProductType;

	@IsOptional()
	@Field(() => [ProductCategory], { nullable: true })
	categoryList?: ProductCategory[];

	@IsOptional()
	@IsArray()
	@Field(() => [ProductCategory], { nullable: true })
	productCategories?: ProductCategory[];

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	startDate?: Date;

	@IsOptional()
	@IsDate()
	@Field(() => Date, { nullable: true })
	endDate?: Date;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	adults?: number;

	@IsOptional()
	@IsArray()
	@IsInt({ each: true })
	@Min(0, { each: true })
	@Field(() => [Int], { nullable: true })
	childrenAges?: number[];

	@IsOptional()
	@IsInt()
	@Min(1)
	@Field(() => Int, { nullable: true })
	rooms?: number;

	@IsOptional()
	@Field(() => [ProductBookingType], { nullable: true })
	bookingTypeList?: ProductBookingType[];

	@IsOptional()
	@ValidateNested()
	@Type(() => PricesRange)
	@Field(() => PricesRange, { nullable: true })
	pricesRange?: PricesRange;

	@IsOptional()
	@ValidateNested()
	@Type(() => PeriodsRange)
	@Field(() => PeriodsRange, { nullable: true })
	periodsRange?: PeriodsRange;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class ProductsInquiry {
	@Min(1)
	@Field(() => Int)
	page: number;

	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableProductSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@ValidateNested()
	@Type(() => ProductSearch)
	@Field(() => ProductSearch)
	search: ProductSearch;
}

@InputType()
class AllProductsSearch {
	@IsOptional()
	@Field(() => String, { nullable: true })
	memberId?: ObjectId;

	@IsOptional()
	@Field(() => ProductStatus, { nullable: true })
	productStatus?: ProductStatus;

	@IsOptional()
	@Field(() => [ProductRegion], { nullable: true })
	productRegionList?: ProductRegion[];

	@IsOptional()
	@Field(() => [ProductType], { nullable: true })
	productTypeList?: ProductType[];

	@IsOptional()
	@Field(() => [ProductCategory], { nullable: true })
	productCategoryList?: ProductCategory[];

	@IsOptional()
	@Field(() => [ProductBookingType], { nullable: true })
	productBookingTypeList?: ProductBookingType[];

	@IsOptional()
	@Field(() => PricesRange, { nullable: true })
	pricesRange?: PricesRange;

	@IsOptional()
	@Field(() => PeriodsRange, { nullable: true })
	periodsRange?: PeriodsRange;

	@IsOptional()
	@Field(() => String, { nullable: true })
	text?: string;
}

@InputType()
export class AllProductsInquiry {
	@Min(1)
	@Field(() => Int)
	page: number;

	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableProductSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AllProductsSearch)
	search: AllProductsSearch;
}

@InputType()
class AgentProductsSearch {
	@IsOptional()
	@Field(() => ProductStatus, { nullable: true })
	productStatus?: ProductStatus;
}

@InputType()
export class AgentProductsInquiry {
	@Min(1)
	@Field(() => Int)
	page: number;

	@Min(1)
	@Field(() => Int)
	limit: number;

	@IsOptional()
	@IsIn(availableProductSorts)
	@Field(() => String, { nullable: true })
	sort?: string;

	@IsOptional()
	@Field(() => Direction, { nullable: true })
	direction?: Direction;

	@IsNotEmpty()
	@Field(() => AgentProductsSearch)
	search: AgentProductsSearch;
}

@InputType()
export class OrdinaryInquiry {
	@Min(1)
	@Field(() => Int)
	page: number;

	@Min(1)
	@Field(() => Int)
	limit: number;
}
