import { BatchService } from './batch.service';

describe('BatchService product ranking', () => {
	it('uses the preserved rank formulas with product counters', async () => {
		const productUpdate = jest.fn();
		const memberUpdate = jest.fn();
		const productModel = {
			find: jest.fn().mockReturnValue({
				exec: jest.fn().mockResolvedValue([{ _id: 'product-1', productLikes: 3, productViews: 4 }]),
			}),
			findByIdAndUpdate: productUpdate,
		};
		const memberModel = {
			find: jest.fn().mockReturnValue({
				exec: jest.fn().mockResolvedValue([
					{ _id: 'agent-1', memberProducts: 2, memberArticles: 1, memberLikes: 3, memberViews: 4 },
				]),
			}),
			findByIdAndUpdate: memberUpdate,
		};
		const service = new BatchService(productModel as never, memberModel as never);

		await service.batchTopProducts();
		await service.batchTopAgents();

		expect(productUpdate).toHaveBeenCalledWith('product-1', { productRank: 10 });
		expect(memberUpdate).toHaveBeenCalledWith('agent-1', { memberRank: 23 });
	});
});
