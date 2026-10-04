import { Module } from '@nestjs/common';
import { PropertyService } from './property.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ViewModule } from '../view/view.module';
import PropertySchema from '../../schemas/Property.model';
import { PropertyResolver } from './property.resolver';
import { MemberModule } from '../member/member.module';
import { LikeService } from '../like/like.service';
import { LikeModule } from '../like/like.module';


@Module({
	imports: [
		MongooseModule.forFeature([{ name: 'Property', schema: PropertySchema }]),
		AuthModule, // <--- AuthModule shu yerda bo'lishi shart
		ViewModule,
    MemberModule,
	LikeModule,
	],

	providers: [PropertyResolver, PropertyService],
  exports:[PropertyService]
})
export class PropertyModule {}