import { Types } from 'mongoose';
import { MemberStatus, MemberType } from '../../libs/enums/member.enum';
import { MemberService } from './member.service';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }));

describe('MemberService current profile', () => {
	const memberId = new Types.ObjectId();
	let model: any;
	let authService: any;
	let service: MemberService;

	beforeEach(() => {
		model = { findOne: jest.fn(), findOneAndUpdate: jest.fn(), exists: jest.fn() };
		authService = {
			comparePasswords: jest.fn(),
			hashPassword: jest.fn(),
			createToken: jest.fn(),
		};
		service = new MemberService(model, {} as never, authService, {} as never, {} as never);
	});

	it('reads the authenticated ACTIVE member with a safe projection', async () => {
		const profile = { _id: memberId, memberNick: 'traveller' };
		const exec = jest.fn().mockResolvedValue(profile);
		const lean = jest.fn(() => ({ exec }));
		const select = jest.fn(() => ({ lean }));
		model.findOne.mockReturnValue({ select });

		await expect(service.getMyProfile(memberId)).resolves.toBe(profile);
		expect(model.findOne).toHaveBeenCalledWith({ _id: memberId, memberStatus: MemberStatus.ACTIVE });
		const projection = select.mock.calls[0][0];
		expect(projection.memberPassword).toBeUndefined();
		expect(projection.accessToken).toBeUndefined();
		expect(projection.memberWarnings).toBeUndefined();
		expect(projection.memberFollowers).toBe(1);
	});

	it('allowlists self-update fields and ignores injected role/status values', async () => {
		model.exists.mockResolvedValue(null);
		const exec = jest.fn().mockResolvedValue({ _id: memberId, memberNick: 'new-name' });
		model.findOneAndUpdate.mockReturnValue({ select: () => ({ lean: () => ({ exec }) }) });

		await service.updateMember(memberId, {
			memberNick: 'new-name',
			memberType: MemberType.ADMIN,
			memberStatus: MemberStatus.BLOCK,
		} as any);

		expect(model.findOneAndUpdate).toHaveBeenCalledWith(
			{ _id: memberId, memberStatus: MemberStatus.ACTIVE },
			{ $set: { memberNick: 'new-name' } },
			{ new: true },
		);
	});

	it('distinguishes omitted fields from explicit null clearing', async () => {
		model.exists.mockResolvedValue(null);
		const exec = jest.fn().mockResolvedValue({ _id: memberId });
		model.findOneAndUpdate.mockReturnValue({ select: () => ({ lean: () => ({ exec }) }) });

		await service.updateMember(memberId, { memberAddress: null });

		expect(model.findOneAndUpdate.mock.calls[0][1]).toEqual({ $unset: { memberAddress: 1 } });
	});

	it('rejects a duplicate nick or phone before updating', async () => {
		model.exists.mockResolvedValue({ _id: new Types.ObjectId() });
		await expect(service.updateMember(memberId, { memberNick: 'duplicate' })).rejects.toThrow();
		expect(model.findOneAndUpdate).not.toHaveBeenCalled();
	});

	it('verifies the current password and saves only a hash', async () => {
		const save = jest.fn();
		const member = { memberPassword: 'stored-hash', save };
		model.findOne.mockReturnValue({ select: () => ({ exec: jest.fn().mockResolvedValue(member) }) });
		authService.comparePasswords.mockResolvedValue(true);
		authService.hashPassword.mockResolvedValue('new-hash');

		await expect(
			service.changeMyPassword(memberId, { currentPassword: 'old-pass', newPassword: 'new-pass' }),
		).resolves.toBe(true);
		expect(authService.comparePasswords).toHaveBeenCalledWith('old-pass', 'stored-hash');
		expect(member.memberPassword).toBe('new-hash');
		expect(save).toHaveBeenCalled();
	});

	it('floors transactional counter decrements at zero', async () => {
		const session = {} as any;
		const query = { session: jest.fn(), exec: jest.fn().mockResolvedValue({ _id: memberId }) };
		model.findOneAndUpdate.mockReturnValue(query);

		await service.memberStatsEditor(
			{ _id: memberId, targetKey: 'memberFollowers', modifier: -1 },
			session,
		);

		expect(model.findOneAndUpdate).toHaveBeenCalledWith(
			{ _id: memberId },
			[{ $set: { memberFollowers: { $max: [0, { $add: [{ $ifNull: ['$memberFollowers', 0] }, -1] }] } } }],
			{ new: true },
		);
		expect(query.session).toHaveBeenCalledWith(session);
	});
});
