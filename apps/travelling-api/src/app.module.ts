import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { DatabaseModule } from './database/database.module';
import { ComponentModule } from './components/components.module';
import { PropertyModule } from './components/property/property.module';
import { SocketModule } from './socket/socket.module';

@Module({
  imports: [
    ConfigModule.forRoot(),

    GraphQLModule.forRoot({
      driver: ApolloDriver,
      playground: true,
      uploads: false,
      autoSchemaFile: true,
      formatError: (error: any) => {

const graphqlFormattedError = {
  code: error?.extensions?.code,
  message:
    error?.extensions?.exception?.response?.message ||
    error?.extensions?.response?.message ||
    error?.message,
};
  console.log('GRAPHQL GLOBAL ERR:', graphqlFormattedError);

  return graphqlFormattedError;
},
    }),
   ComponentModule,
    DatabaseModule, 
       SocketModule],
       //Databasega ulanish mantigi yozilgan module.Uni alohida tashkillashtirdik sababi loyiha ishga tushganda databasega connect 1 marta amalga oshadi va yakunlanadi
  
  controllers: [AppController],
  providers: [AppService ,AppResolver],
})
export class AppModule {}