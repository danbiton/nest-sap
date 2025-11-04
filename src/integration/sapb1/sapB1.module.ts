import { Module } from "@nestjs/common";
import { SapB1Controller } from './sapB1.controller';
import { SapB1Service } from './sapB1.service';
import { HttpModule } from '@nestjs/axios';
import { SapB1Client } from "./sapB1.client";


@Module({
  imports: [HttpModule],
  controllers: [SapB1Controller],
  providers: [SapB1Service, SapB1Client],
})
// export class SapB1Module implements NestModule {
//   configure(consumer: MiddlewareConsumer) {
//     consumer
//       .apply(SapB1Middleware)
//       .forRoutes('*'); 
//   }
export class SapB1Module {}
