import { Module } from '@nestjs/common';
import { GraphController } from './graph.controller';
import { GraphService } from './graph.service';
import { WebhookController } from './Webhook.controller';


@Module({
  controllers: [GraphController, WebhookController],
  providers: [GraphService],
  exports: [GraphService]
})
export class GraphModule {}
