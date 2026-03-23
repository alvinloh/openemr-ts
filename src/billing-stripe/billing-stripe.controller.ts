import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  RawBodyRequest,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { TenantGuard } from '../tenant/guards/tenant.guard.js';
import { BillingStripeService } from './billing-stripe.service.js';

@ApiTags('Billing')
@Controller('api/tenant/billing')
export class BillingStripeController {
  constructor(
    private readonly billingService: BillingStripeService,
    private readonly configService: ConfigService,
  ) {}

  @Post('checkout')
  @UseGuards(TenantGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Create a Stripe checkout session for plan upgrade' })
  @ApiHeader({ name: 'x-api-key', description: 'Tenant API key' })
  async createCheckout(
    @Request() req: any,
    @Body() body: { plan: string; successUrl?: string; cancelUrl?: string },
  ) {
    return this.billingService.createCheckoutSession(
      req.tenant,
      body.plan,
      body.successUrl || '',
      body.cancelUrl || '',
    );
  }

  @Get('subscription')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Get current subscription details' })
  @ApiHeader({ name: 'x-api-key', description: 'Tenant API key' })
  async getSubscription(@Request() req: any) {
    const sub = await this.billingService.getSubscription(req.tenant.id);
    if (!sub) {
      return { plan: 'free', status: 'active', message: 'No paid subscription' };
    }
    return {
      plan: sub.plan,
      status: sub.status,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelledAt: sub.cancelledAt,
    };
  }

  @Get('portal')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Get Stripe billing portal URL for managing subscription' })
  @ApiHeader({ name: 'x-api-key', description: 'Tenant API key' })
  async getBillingPortal(@Request() req: any) {
    const url = await this.billingService.getBillingPortalUrl(req.tenant);
    return { portalUrl: url };
  }

  @Post('upgrade')
  @UseGuards(TenantGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Quick upgrade — returns checkout URL for the specified plan' })
  @ApiHeader({ name: 'x-api-key', description: 'Tenant API key' })
  @ApiQuery({ name: 'plan', required: true, enum: ['paygo', 'pro', 'enterprise'] })
  async quickUpgrade(@Request() req: any, @Query('plan') plan: string) {
    return this.billingService.createCheckoutSession(req.tenant, plan, '', '');
  }
}

/**
 * Stripe webhook endpoint — separate controller since it doesn't use TenantGuard
 */
@Controller('api/webhooks')
export class StripeWebhookController {
  constructor(
    private readonly billingService: BillingStripeService,
    private readonly configService: ConfigService,
  ) {}

  @Post('stripe')
  @HttpCode(200)
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async handleWebhook(
    @Body() body: any,
    @Headers('stripe-signature') signature: string,
  ) {
    // In production, verify the webhook signature using Stripe SDK
    // For now, process the event directly
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (webhookSecret && !signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    await this.billingService.handleWebhook(body);
    return { received: true };
  }
}
