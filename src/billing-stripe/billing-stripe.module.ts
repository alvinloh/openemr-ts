import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity.js';
import { BillingStripeService } from './billing-stripe.service.js';
import { BillingStripeController, StripeWebhookController } from './billing-stripe.controller.js';
import { TenantModule } from '../tenant/tenant.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription]),
    TenantModule,
  ],
  controllers: [BillingStripeController, StripeWebhookController],
  providers: [BillingStripeService],
  exports: [BillingStripeService],
})
export class BillingStripeModule {}
