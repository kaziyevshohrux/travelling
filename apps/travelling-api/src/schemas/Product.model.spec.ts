import ProductSchema from './Product.model';
import MemberSchema from './Member.model';
import NotificationSchema from './Notification.model';
import LikeSchema from './Like.model';
import ViewSchema from './View.model';
import { CommentGroup } from '../libs/enums/comment.enum';
import { LikeGroup } from '../libs/enums/like.enum';
import { NotificationGroup } from '../libs/enums/notification.enum';
import { ViewGroup } from '../libs/enums/view.enum';

describe('product persistence contract', () => {
	it('uses products and the approved defaults', () => {
		expect(ProductSchema.get('collection')).toBe('products');
		expect(ProductSchema.path('productCurrency').getDefault({})).toBe('KRW');
		expect(ProductSchema.path('productStatus').getDefault({})).toBe('ACTIVE');
		expect(ProductSchema.path('productPrice').options.min).toBe(0);
		expect(ProductSchema.path('productDetails').instance).toBe('Mixed');
		expect(ProductSchema.path('productRegion').options.required).toBe(true);
		expect(ProductSchema.path('productCategories')).toBeDefined();
		expect(ProductSchema.path('productFamilyFriendly').getDefault({})).toBe(false);
		expect(ProductSchema.path('productMaxGuests').options.min).toBe(1);
		expect(ProductSchema.path('productAvailability')).toBeDefined();
		const availabilitySchema = ProductSchema.path('productAvailability').schema;
		expect(availabilitySchema.path('availabilityEnd')).toBeDefined();
		expect(availabilitySchema.path('isBlocked').getDefault({})).toBe(false);
		expect(availabilitySchema.path('capacityRooms').options.min).toBe(0);
		expect(availabilitySchema.path('capacitySeats').options.min).toBe(0);
	});

	it('rewires member, notification, and shared groups to product terminology', () => {
		expect(MemberSchema.path('memberProducts')).toBeDefined();
		expect(MemberSchema.path('memberProperties')).toBeUndefined();
		expect(NotificationSchema.path('productId').options.ref).toBe('Product');
		expect(NotificationSchema.path('propertyId')).toBeUndefined();
		expect(LikeGroup.PRODUCT).toBe('PRODUCT');
		expect(ViewGroup.PRODUCT).toBe('PRODUCT');
		expect(CommentGroup.PRODUCT).toBe('PRODUCT');
		expect(NotificationGroup.PRODUCT).toBe('PRODUCT');
		expect(LikeSchema.indexes()).toContainEqual([
			{ memberId: 1, likeRefId: 1, likeGroup: 1 },
			{ unique: true, background: true },
		]);
		expect(ViewSchema.indexes()).toContainEqual([
			{ memberId: 1, viewRefId: 1, viewGroup: 1 },
			{ unique: true, background: true },
		]);
	});
});
