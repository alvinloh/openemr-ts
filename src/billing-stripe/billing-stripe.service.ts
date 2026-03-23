import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Subscription, SubscriptionStatus } from './entities/subscription.entity.js';
import { Tenant, PlanTier } from '../tenant/entities/tenant.entity.js';
import { TenantService } from '../tenant/tenant.service.js';

// Plan → Stripe price ID mapping (configured via env vars)
const PLAN_PRICE_MAP: Record<string, string> = {
  paygo: 'STRIPE_PRICE_PAYGO',
  pro: 'STRIPE_PRICE_PRO',
  enterprise: 'STRIPE_PRICE_ENTERPRISE',
};

@Injectable()
export class BillingStripeService {
  private readonly logger = new Logger(BillingStripeService.name);
  private stripe: any | null = null;

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly tenantService: TenantService,
    private readonly configService: ConfigService,
  ) {
    this.initStripe();
  }

  private initStripe() {
    const key = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (key) {
      // Dynamic import to avoid hard dependency when Stripe isn't configured
      const moduleName = 'stripe';
      (Function('m', 'return import(m)')(moduleName) as Promise<any>).then(({ default: Stripe }: any) => {
        this.stripe = new Stripe(key);
        this.logger.log('Stripe initialized');
      }).catch(() => {
        this.logger.warn('Stripe module not installed. Run: npm install stripe');
      });
    } else {
      this.logger.warn('STRIPE_SECRET_KEY not configured. Billing features disabled.');
    }
  }

  private ensureStripe() {
    if (!this.stripe) {
      throw new BadRequestException(
        'Billing is not configured. Set STRIPE_SECRET_KEY environment variable.',
      );
    }
  }

  /**
   * Create a Stripe checkout session for upgrading a plan
   */
  async createCheckoutSession(
    tenant: Tenant,
    plan: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ checkoutUrl: string }> {
    this.ensureStripe();

    if (plan === 'free') {
      throw new BadRequestException('Cannot subscribe to free plan via checkout');
    }

    const priceEnvVar = PLAN_PRICE_MAP[plan];
    if (!priceEnvVar) {
      throw new BadRequestException(`Unknown plan: ${plan}. Available: paygo, pro, enterprise`);
    }
    const priceId = this.configService.get<string>(priceEnvVar);
    if (!priceId) {
      throw new BadRequestException(`Stripe price not configured for plan: ${plan}`);
    }

    // Get or create Stripe customer
    let customerId = tenant.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: tenant.email,
        name: tenant.name,
        metadata: {
          tenantId: String(tenant.id),
          tenantUuid: tenant.uuid,
        },
      });
      customerId = customer.id;
      // Save customer ID to tenant
      tenant.stripeCustomerId = customerId;
      await this.tenantService.updatePlan(tenant, tenant.plan);
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${this.configService.get('APP_URL', 'http://localhost:3000')}/billing/success`,
      cancel_url: cancelUrl || `${this.configService.get('APP_URL', 'http://localhost:3000')}/billing/cancel`,
      metadata: {
        tenantId: String(tenant.id),
        plan,
      },
    });

    return { checkoutUrl: session.url };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: any): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      default:
        this.logger.log(`Unhandled Stripe event: ${event.type}`);
    }
  }

  async getSubscription(tenantId: number): Promise<Subscription | null> {
    return this.subscriptionRepo.findOne({ where: { tenantId } });
  }

  async getBillingPortalUrl(tenant: Tenant): Promise<string> {
    this.ensureStripe();
    if (!tenant.stripeCustomerId) {
      throw new BadRequestException('No billing account found. Upgrade to a paid plan first.');
    }
    const session = await this.stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${this.configService.get('APP_URL', 'http://localhost:3000')}/`,
    });
    return session.url;
  }

  // --- Webhook handlers ---

  private async handleCheckoutCompleted(session: any): Promise<void> {
    const tenantId = parseInt(session.metadata?.tenantId);
    const plan = session.metadata?.plan;
    if (!tenantId || !plan) return;

    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) return;

    // Update tenant plan
    await this.tenantService.updatePlan(tenant, plan as PlanTier);

    // Create or update subscription record
    if (session.subscription) {
      const sub = await this.stripe.subscriptions.retrieve(session.subscription);
      await this.subscriptionRepo.save(
        this.subscriptionRepo.create({
          tenantId,
          stripeSubscriptionId: sub.id,
          stripeCustomerId: session.customer,
          plan,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        }),
      );
    }

    this.logger.log(`Tenant ${tenantId} upgraded to ${plan}`);
  }

  private async handleSubscriptionUpdated(sub: any): Promise<void> {
    const existing = await this.subscriptionRepo.findOne({
      where: { stripeSubscriptionId: sub.id },
    });
    if (!existing) return;

    existing.status = sub.status as SubscriptionStatus;
    existing.currentPeriodStart = new Date(sub.current_period_start * 1000);
    existing.currentPeriodEnd = new Date(sub.current_period_end * 1000);
    if (sub.canceled_at) {
      existing.cancelledAt = new Date(sub.canceled_at * 1000);
    }
    await this.subscriptionRepo.save(existing);
  }

  private async handleSubscriptionDeleted(sub: any): Promise<void> {
    const existing = await this.subscriptionRepo.findOne({
      where: { stripeSubscriptionId: sub.id },
    });
    if (!existing) return;

    existing.status = SubscriptionStatus.CANCELLED;
    existing.cancelledAt = new Date();
    await this.subscriptionRepo.save(existing);

    // Downgrade tenant to free
    const tenant = await this.tenantService.findById(existing.tenantId);
    if (tenant) {
      await this.tenantService.updatePlan(tenant, PlanTier.FREE);
      this.logger.log(`Tenant ${existing.tenantId} downgraded to free (subscription cancelled)`);
    }
  }

  private async handlePaymentFailed(invoice: any): Promise<void> {
    const customerId = invoice.customer;
    const sub = await this.subscriptionRepo.findOne({
      where: { stripeCustomerId: customerId },
    });
    if (sub) {
      sub.status = SubscriptionStatus.PAST_DUE;
      await this.subscriptionRepo.save(sub);
      this.logger.warn(`Payment failed for tenant ${sub.tenantId}`);
    }
  }
}
