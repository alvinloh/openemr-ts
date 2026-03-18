import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Webhook } from './entities/webhook.entity.js';
import { WebhookLog } from './entities/webhook-log.entity.js';
import { WebhookService } from './webhook.service.js';
import { WebhookController } from './webhook.controller.js';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Webhook, WebhookLog])],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
