import { AuthModule } from './auth/auth.module';
import { LikeModule } from './like/like.module';
import { ViewModule } from './view/view.module';
import { FollowModule } from './follow/follow.module';
import { BoardArticleModule } from './board-article/board-article.module';
import { MemberModule } from './member/member.module';
import { Module } from '@nestjs/common';
import { PropertyModule } from './property/property.module';
import { CommentModule } from './comment/comment.module';

@Module({
    imports: [
        MemberModule,
        AuthModule,
        PropertyModule,
        BoardArticleModule,
        LikeModule,
        ViewModule,
        CommentModule,
        FollowModule


        
    ],
})

export class ComponentModule{}