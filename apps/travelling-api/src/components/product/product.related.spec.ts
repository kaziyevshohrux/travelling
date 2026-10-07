import { Types } from 'mongoose';
import { LikeService } from '../like/like.service';
import { ViewService } from '../view/view.service';
import { ProductStatus } from '../../libs/enums/product.enum';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }));

describe('Product related lookups', () => {
	const memberId = new Types.ObjectId();

	it('keeps inactive and deleted products out of favorites', async () => {
		const aggregate = jest.fn().mockReturnValue({
			exec: jest.fn().mockResolvedValue([{ list: [], metaCounter: [] }]),
		});
		const service = new LikeService({ aggregate } as never);

		await service.getFavoriteProducts(memberId, { page: 1, limit: 10 });

		const pipeline = aggregate.mock.calls[0][0];
		expect(pipeline).toContainEqual({ $match: { 'favoriteProduct.productStatus': ProductStatus.ACTIVE } });
		expect(pipeline.at(-1).$facet.metaCounter).toEqual([{ $count: 'total' }]);
	});

	it('keeps inactive and deleted products out of visited products', async () => {
		const aggregate = jest.fn().mockReturnValue({
			exec: jest.fn().mockResolvedValue([{ list: [], metaCounter: [] }]),
		});
		const service = new ViewService({ aggregate } as never);

		await service.getVisitedProducts(memberId, { page: 1, limit: 10 });

		const pipeline = aggregate.mock.calls[0][0];
		expect(pipeline).toContainEqual({ $match: { 'visitedProduct.productStatus': ProductStatus.ACTIVE } });
		expect(pipeline.at(-1).$facet.metaCounter).toEqual([{ $count: 'total' }]);
	});
});
