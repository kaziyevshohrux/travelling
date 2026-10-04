import { Field, Float, InputType } from '@nestjs/graphql';
import { IsObject, IsOptional, IsString, Length, Matches, Min } from 'class-validator';
import type { ObjectId } from 'mongoose';
import {
	ProductBookingType,
	ProductCategory,
	ProductPriceUnit,
	ProductRegion,
	ProductStatus,
	ProductType,
} from '../../enums/product.enum';
import { JSONObjectScalar } from '../../scalars/json-object.scalar';

@InputType()
export class ProductUpdate {
	@Field(() => String)
	_id: ObjectId;

	@IsOptional()
	@Field(() => ProductType, { nullable: true })
	productType?: ProductType;

	@IsOptional()
	@Field(() => ProductStatus, { nullable: true })
	productStatus?: ProductStatus;

	@IsOptional()
	@Field(() => ProductCategory, { nullable: true })
	productCategory?: ProductCategory;

	@IsOptional()
	@Field(() => ProductRegion, { nullable: true })
	productRegion?: ProductRegion;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	productAddress?: string;

	@IsOptional()
	@Length(3, 100)
	@Field(() => String, { nullable: true })
	productTitle?: string;

	@IsOptional()
	@Min(0)
	@Field(() => Float, { nullable: true })
	productPrice?: number;

	@IsOptional()
	@Matches(/^[A-Z]{3}$/)
	@Field(() => String, { nullable: true })
	productCurrency?: string;

	@IsOptional()
	@Field(() => ProductPriceUnit, { nullable: true })
	productPriceUnit?: ProductPriceUnit;

	@IsOptional()
	@Field(() => ProductBookingType, { nullable: true })
	productBookingType?: ProductBookingType;

	@IsOptional()
	@IsString({ each: true })
	@Field(() => [String], { nullable: true })
	productImages?: string[];

	@IsOptional()
	@Length(5, 500)
	@Field(() => String, { nullable: true })
	productDesc?: string;

	@IsOptional()
	@IsObject()
	@Field(() => JSONObjectScalar, { nullable: true })
	productDetails?: Record<string, unknown>;

	deletedAt?: Date;
}
