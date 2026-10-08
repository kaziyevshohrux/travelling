import { Types } from 'mongoose';
import { MemberStatus } from '../../libs/enums/member.enum';
import { FollowService } from './follow.service';
import FollowSchema from '../../schemas/Follow.model';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }));

describe('FollowService', () => {
	const viewerId = new Types.ObjectId();
	const targetId = new Types.ObjectId();
	let model: any;
	let memberService: any;
	let service: FollowService;

	beforeEach(() => {
		model = { aggregate: jest.fn(), create: jest.fn(), findOneAndDelete: jest.fn(), db: {} };
		memberService = { getMember: jest.fn(), memberStatsEditor: jest.fn() };
		service = new FollowService(model, memberService);
	});

	it.each([
		['followings', 'getMemberFollowings', 'followerId', 'followingId', 'followingData'],
		['followers', 'getMemberFollowers', 'followingId', 'followerId', 'followerData'],
	] as const)('uses the correct %s direction and counts only joined eligible members', async (_label, method, filter, joined, data) => {
		model.aggregate.mockReturnValue({ exec: jest.fn().mockResolvedValue([{ list: [], metaCounter: [] }]) });
		await service[method](viewerId, { page: 2, limit: 5, search: { [filter]: targetId } });

		const pipeline = model.aggregate.mock.calls[0][0];
		expect(pipeline[0]).toEqual({ $match: { [filter]: targetId } });
		expect(pipeline[1].$lookup.let).toEqual({ memberId: `$${joined}` });
		expect(pipeline[1].$lookup.pipeline[0].$match.memberStatus).toEqual({
			$in: [MemberStatus.ACTIVE, MemberStatus.BLOCK],
		});
		expect(pipeline[2]).toEqual({ $unwind: `$${data}` });
		expect(pipeline[3]).toEqual({ $sort: { createdAt: -1, _id: -1 } });
		expect(pipeline[4].$facet.list.slice(0, 2)).toEqual([{ $skip: 5 }, { $limit: 5 }]);
		expect(pipeline[4].$facet.metaCounter).toEqual([{ $count: 'total' }]);
		const followLookup = pipeline[4].$facet.list.find((stage: any) => stage.$lookup?.from === 'follows');
		expect(followLookup.$lookup.let.localFollowerRefId).toBe(viewerId);
	});

	it('rejects self-follow before writing', async () => {
		await expect(service.subscribe(viewerId, viewerId)).rejects.toThrow();
		expect(model.create).not.toHaveBeenCalled();
	});

	it('declares uniqueness and both deterministic list indexes', () => {
		const indexes = FollowSchema.indexes();
		expect(indexes).toEqual(expect.arrayContaining([
			[{ followingId: 1, followerId: 1 }, { unique: true, background: true }],
			[{ followerId: 1, createdAt: -1, _id: -1 }, { background: true }],
			[{ followingId: 1, createdAt: -1, _id: -1 }, { background: true }],
		]));
	});

	it('rejects invalid pagination before aggregation', async () => {
		await expect(
			service.getMemberFollowings(null, { page: 1.5, limit: 5, search: { followerId: targetId } }),
		).rejects.toThrow();
		expect(model.aggregate).not.toHaveBeenCalled();
	});

	it('creates the follow and both counters in one transaction', async () => {
		const session = {
			withTransaction: jest.fn(async (callback) => callback()),
			endSession: jest.fn(),
		};
		model.db.startSession = jest.fn().mockResolvedValue(session);
		memberService.getMember.mockResolvedValue({ _id: targetId });
		model.create.mockResolvedValue([{ _id: new Types.ObjectId(), followerId: viewerId, followingId: targetId }]);

		await service.subscribe(viewerId, targetId);

		expect(model.create).toHaveBeenCalledWith([{ followerId: viewerId, followingId: targetId }], { session });
		expect(memberService.memberStatsEditor).toHaveBeenNthCalledWith(
			1,
			{ _id: viewerId, targetKey: 'memberFollowings', modifier: 1 },
			session,
		);
		expect(memberService.memberStatsEditor).toHaveBeenNthCalledWith(
			2,
			{ _id: targetId, targetKey: 'memberFollowers', modifier: 1 },
			session,
		);
		expect(session.endSession).toHaveBeenCalled();
	});

	it('does not decrement counters when no follow record exists', async () => {
		const session = {
			withTransaction: jest.fn(async (callback) => callback()),
			endSession: jest.fn(),
		};
		model.db.startSession = jest.fn().mockResolvedValue(session);
		memberService.getMember.mockResolvedValue({ _id: targetId });
		model.findOneAndDelete.mockReturnValue({ session: () => ({ exec: jest.fn().mockResolvedValue(null) }) });

		await expect(service.unsubscribe(viewerId, targetId)).rejects.toThrow();
		expect(memberService.memberStatsEditor).not.toHaveBeenCalled();
		expect(session.endSession).toHaveBeenCalled();
	});
});
