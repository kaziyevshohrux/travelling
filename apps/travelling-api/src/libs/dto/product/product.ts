import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
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
import { Member, TotalCounter } from '../member/member';
import { MeLiked } from '../like/like';

@ObjectType()
export class ProductAvailability {
	@Field(() => Date)
	availabilityDate: Date;

	@Field(() => Date, { nullable: true })
	availabilityEnd?: Date;

	@Field(() => Boolean, { nullable: true })
	isBlocked?: boolean;

	@Field(() => Int, { nullable: true })
	capacityRooms?: number;

	@Field(() => Int, { nullable: true })
	remainingRooms?: number;

	@Field(() => Int, { nullable: true })
	capacitySeats?: number;

	@Field(() => Int, { nullable: true })
	remainingSeats?: number;
}

@ObjectType()
export class ProductPriceBreakdown {
	@Field(() => String)
	label: string;

	@Field(() => Float)
	unitPrice: number;

	@Field(() => Int)
	quantity: number;

	@Field(() => Float)
	amount: number;
}

@ObjectType()
export class ProductPriceQuote {
	@Field(() => String)
	productId: ObjectId;

	@Field(() => String)
	currency: string;

	@Field(() => ProductPriceUnit)
	priceUnit: ProductPriceUnit;

	@Field(() => Float)
	unitPrice: number;

	@Field(() => Int)
	quantity: number;

	@Field(() => Float)
	subtotal: number;

	@Field(() => Float)
	total: number;

	@Field(() => Boolean)
	inventoryAvailable: boolean;

	@Field(() => [ProductPriceBreakdown])
	breakdown: ProductPriceBreakdown[];

	@Field(() => String)
	disclaimer: string;
}

@ObjectType()
export class Product {
	@Field(() => String)
	_id: ObjectId;

	@Field(() => ProductType)
	productType: ProductType;

	@Field(() => ProductStatus)
	productStatus: ProductStatus;

	@Field(() => ProductCategory)
	productCategory: ProductCategory;

	@Field(() => [ProductCategory], { nullable: true })
	productCategories?: ProductCategory[];

	@Field(() => Boolean, { nullable: true })
	productFamilyFriendly?: boolean;

	@Field(() => ProductRegion)
	productRegion: ProductRegion;

	@Field(() => String)
	productAddress: string;

	@Field(() => String)
	productTitle: string;

	@Field(() => Float)
	productPrice: number;

	@Field(() => String)
	productCurrency: string;

	@Field(() => ProductPriceUnit)
	productPriceUnit: ProductPriceUnit;

	@Field(() => ProductBookingType)
	productBookingType: ProductBookingType;

	@Field(() => Int)
	productViews: number;

	@Field(() => Int)
	productLikes: number;

	@Field(() => Int)
	productComments: number;

	@Field(() => Int)
	productRank: number;

	@Field(() => [String])
	productImages: string[];

	@Field(() => String, { nullable: true })
	productDesc?: string;

	@Field(() => JSONObjectScalar, { nullable: true })
	productDetails?: Record<string, unknown>;

	@Field(() => Int, { nullable: true })
	productMaxGuests?: number;

	@Field(() => Int, { nullable: true })
	productMinChildAge?: number;

	@Field(() => Int, { nullable: true })
	productMaxChildAge?: number;

	@Field(() => [ProductAvailability], { nullable: true })
	productAvailability?: ProductAvailability[];

	@Field(() => String)
	memberId: ObjectId;

	@Field(() => Date, { nullable: true })
	deletedAt?: Date;

	@Field(() => Date)
	createdAt: Date;

	@Field(() => Date)
	updatedAt: Date;

	@Field(() => Member, { nullable: true })
	memberData?: Member;

	@Field(() => [MeLiked], { nullable: true })
	meLiked?: MeLiked[];
}

@ObjectType()
export class Products {
	@Field(() => [Product])
	list: Product[];

	@Field(() => [TotalCounter], { nullable: true })
	metaCounter: TotalCounter[];
}
