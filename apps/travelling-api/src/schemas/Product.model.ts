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
		memberId: { type: Schema.Types.ObjectId, required: true, ref: 'Member' },
		deletedAt: { type: Date },
	},
	{ timestamps: true, collection: 'products' },
);

ProductSchema.index({ productStatus: 1, productType: 1, productCategory: 1, productRegion: 1, createdAt: -1 });
ProductSchema.index({ memberId: 1, productStatus: 1, createdAt: -1 });

export default ProductSchema;
