import { Module } from '@nestjs/common';
import { GraphController } from './graph.controller';
import { GraphService } from './graph.service';
import { WebhookController } from './webhook.controller';

@Module({
  controllers: [GraphController, WebhookController],
  providers: [GraphService],
  exports: [GraphService]
})
export class GraphModule {}
