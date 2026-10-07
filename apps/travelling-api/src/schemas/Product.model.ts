import { Schema } from 'mongoose';
import {
	ProductBookingType,
	ProductCategory,
	ProductPriceUnit,
	ProductRegion,
	ProductStatus,
	ProductType,
} from '../libs/enums/product.enum';

const ProductSchema = new Schema(
	{
		productType: { type: String, enum: ProductType, required: true },
		productStatus: { type: String, enum: ProductStatus, default: ProductStatus.ACTIVE },
		productCategory: { type: String, enum: ProductCategory, required: true },
		productCategories: [{ type: String, enum: ProductCategory }],
		productFamilyFriendly: { type: Boolean, default: false },
		productRegion: { type: String, enum: ProductRegion, required: true },
		productAddress: { type: String, required: true },
		productTitle: { type: String, required: true },
		productPrice: { type: Number, min: 0, required: true },
		productCurrency: { type: String, default: 'KRW', required: true, uppercase: true, match: /^[A-Z]{3}$/ },
		productPriceUnit: { type: String, enum: ProductPriceUnit, required: true },
		productBookingType: { type: String, enum: ProductBookingType, required: true },
		productViews: { type: Number, default: 0 },
		productLikes: { type: Number, default: 0 },
		productComments: { type: Number, default: 0 },
		productRank: { type: Number, default: 0 },
		productImages: { type: [String], required: true },
		productDesc: { type: String },
		productDetails: { type: Schema.Types.Mixed },
		productMaxGuests: { type: Number, min: 1 },
		productMinChildAge: { type: Number, min: 0 },
		productMaxChildAge: { type: Number, min: 0 },
		productAvailability: [
			{
				availabilityDate: { type: Date, required: true },
				availabilityEnd: { type: Date },
				isBlocked: { type: Boolean, default: false },
				capacityRooms: { type: Number, min: 0 },
				remainingRooms: { type: Number, min: 0 },
				capacitySeats: { type: Number, min: 0 },
				remainingSeats: { type: Number, min: 0 },
				_id: false,
			},
		],
		memberId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
		deletedAt: { type: Date },
	},
	{ timestamps: true, collection: 'products' },
);

ProductSchema.index({ productStatus: 1, productType: 1, productCategory: 1, productRegion: 1, createdAt: -1 });
ProductSchema.index({ productStatus: 1, productType: 1, productCategories: 1, productRegion: 1, createdAt: -1 });
ProductSchema.index({ memberId: 1, productStatus: 1, createdAt: -1 });
ProductSchema.index({ productType: 1, 'productAvailability.availabilityDate': 1 });

export default ProductSchema;
