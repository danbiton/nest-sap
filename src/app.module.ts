import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SapB1Module } from './integration/sapb1/sapB1.module';
import { GraphModule } from './graph/graph.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SapB1Module,
    GraphModule,
  ],
})
export class AppModule {}
