import { Test } from '@nestjs/testing';
import { GraphQLSchemaBuilderModule, GraphQLSchemaFactory } from '@nestjs/graphql';
import { printSchema } from 'graphql';
import { MemberResolver } from './member.resolver';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }));
jest.mock('../auth/guards/auth.guard', () => ({ AuthGuard: class AuthGuard {} }));
jest.mock('../auth/guards/roles.guard', () => ({ RolesGuard: class RolesGuard {} }));
jest.mock('../auth/guards/without.guard', () => ({ WithoutGuard: class WithoutGuard {} }));

describe('Member current-profile GraphQL contract', () => {
	it('uses an auth-derived safe profile contract while retaining operation names', async () => {
		const moduleRef = await Test.createTestingModule({ imports: [GraphQLSchemaBuilderModule] }).compile();
		const schemaFactory = moduleRef.get(GraphQLSchemaFactory);
		const schema = printSchema(await schemaFactory.create([MemberResolver]));

		expect(schema).toContain('getMyProfile: MyProfile!');
		expect(schema).toContain('updateMember(input: MyProfileUpdate!): MyProfile!');
		expect(schema).toContain('changeMyPassword(input: ChangeMyPasswordInput!): Boolean!');
		const profileType = schema.slice(schema.indexOf('type MyProfile {'), schema.indexOf('type TotalCounter'));
		expect(profileType).toContain('memberFollowers: Int!');
		expect(profileType).not.toContain('memberPassword');
		expect(profileType).not.toContain('accessToken');
		expect(profileType).not.toContain('memberWarnings');
		const updateInput = schema.slice(schema.indexOf('input MyProfileUpdate {'), schema.indexOf('input ChangeMyPasswordInput'));
		expect(updateInput).not.toContain('_id');
		expect(updateInput).not.toContain('memberType');
		expect(updateInput).not.toContain('memberStatus');
	});
});
