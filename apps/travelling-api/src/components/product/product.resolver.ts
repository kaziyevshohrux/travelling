import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import type { ObjectId } from 'mongoose';
import { AuthMember } from '../auth/decorators/authMember.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { WithoutGuard } from '../auth/guards/without.guard';
import { shapeIntoMongoObjectId } from '../../libs/config';
import { MemberType } from '../../libs/enums/member.enum';
import { Product, Products } from '../../libs/dto/product/product';
import {
	AgentProductsInquiry,
	AllProductsInquiry,
	OrdinaryInquiry,
	ProductInput,
	ProductsInquiry,
} from '../../libs/dto/product/product.input';
import { ProductUpdate } from '../../libs/dto/product/product.update';
import { ProductService } from './product.service';

@Resolver()
export class ProductResolver {
	constructor(private readonly productService: ProductService) {}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Product)
	public async createProduct(
		@Args('input') input: ProductInput,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Product> {
		input.memberId = memberId;
		return this.productService.createProduct(input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Product)
	public async getProduct(
		@Args('productId') input: string,
		@AuthMember('_id') memberId: ObjectId | null,
	): Promise<Product> {
		return this.productService.getProduct(memberId, shapeIntoMongoObjectId(input));
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Mutation(() => Product)
	public async updateProduct(
		@Args('input') input: ProductUpdate,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Product> {
		input._id = shapeIntoMongoObjectId(input._id);
		return this.productService.updateProduct(memberId, input);
	}

	@UseGuards(WithoutGuard)
	@Query(() => Products)
	public async getProducts(
		@Args('input') input: ProductsInquiry,
		@AuthMember('_id') memberId: ObjectId | null,
	): Promise<Products> {
		return this.productService.getProducts(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Products)
	public async getFavorites(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Products> {
		return this.productService.getFavorites(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Query(() => Products)
	public async getVisited(
		@Args('input') input: OrdinaryInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Products> {
		return this.productService.getVisited(memberId, input);
	}

	@Roles(MemberType.AGENT)
	@UseGuards(RolesGuard)
	@Query(() => Products)
	public async getAgentProducts(
		@Args('input') input: AgentProductsInquiry,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Products> {
		return this.productService.getAgentProducts(memberId, input);
	}

	@UseGuards(AuthGuard)
	@Mutation(() => Product)
	public async likeTargetProduct(
		@Args('productId') input: string,
		@AuthMember('_id') memberId: ObjectId,
	): Promise<Product> {
		return this.productService.likeTargetProduct(memberId, shapeIntoMongoObjectId(input));
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Query(() => Products)
	public async getAllProductsByAdmin(@Args('input') input: AllProductsInquiry): Promise<Products> {
		return this.productService.getAllProductsByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Product)
	public async updateProductByAdmin(@Args('input') input: ProductUpdate): Promise<Product> {
		input._id = shapeIntoMongoObjectId(input._id);
		return this.productService.updateProductByAdmin(input);
	}

	@Roles(MemberType.ADMIN)
	@UseGuards(RolesGuard)
	@Mutation(() => Product)
	public async removeProductByAdmin(@Args('productId') input: string): Promise<Product> {
		return this.productService.removeProductByAdmin(shapeIntoMongoObjectId(input));
	}
}
