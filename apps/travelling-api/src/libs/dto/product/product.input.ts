import { Field, Float, InputType, Int } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString, Length, Matches, Min } from 'class-validator';
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
export class ProductInput {
	@IsNotEmpty()
	@Field(() => ProductType)
	productType: ProductType;

	@IsNotEmpty()
	@Field(() => ProductCategory)
	productCategory: ProductCategory;

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
	@Field(() => [ProductType], { nullable: true })
	typeList?: ProductType[];

	@IsOptional()
	@Field(() => [ProductCategory], { nullable: true })
	categoryList?: ProductCategory[];

	@IsOptional()
	@Field(() => [ProductBookingType], { nullable: true })
	bookingTypeList?: ProductBookingType[];

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
