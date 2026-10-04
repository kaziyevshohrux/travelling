import { Test } from '@nestjs/testing';
import { GraphQLSchemaBuilderModule, GraphQLSchemaFactory } from '@nestjs/graphql';
import { printSchema } from 'graphql';
import { ProductResolver } from './product.resolver';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }));
jest.mock('../auth/guards/auth.guard', () => ({ AuthGuard: class AuthGuard {} }));
jest.mock('../auth/guards/roles.guard', () => ({ RolesGuard: class RolesGuard {} }));
jest.mock('../auth/guards/without.guard', () => ({ WithoutGuard: class WithoutGuard {} }));

describe('Product GraphQL contract', () => {
	it('generates only product catalog names', async () => {
		const moduleRef = await Test.createTestingModule({ imports: [GraphQLSchemaBuilderModule] }).compile();
		const schemaFactory = moduleRef.get(GraphQLSchemaFactory);
		const schema = printSchema(await schemaFactory.create([ProductResolver]));

		expect(schema).toContain('type Product');
		expect(schema).toContain('input ProductInput');
		expect(schema).toContain('createProduct(input: ProductInput!): Product!');
		expect(schema).toContain('getProduct(productId: String!): Product!');
		expect(schema).toContain('likeTargetProduct(productId: String!): Product!');
		expect(schema).not.toMatch(/Property|properties|property/);
	});
});
