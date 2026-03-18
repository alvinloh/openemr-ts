import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac, randomBytes } from 'crypto';
import { Webhook } from './entities/webhook.entity.js';
import { WebhookLog } from './entities/webhook-log.entity.js';

export const WEBHOOK_EVENTS = [
  'lab.order.created',
  'lab.order.sent',
  'lab.results.received',
  'patient.created',
  'patient.updated',
  'encounter.created',
  'medication.created',
  'appointment.created',
  'appointment.cancelled',
  'document.received',
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepo: Repository<Webhook>,
    @InjectRepository(WebhookLog)
    private readonly logRepo: Repository<WebhookLog>,
  ) {}

  // ── CRUD ──

  async create(data: {
    name: string;
    url: string;
    events: string[];
    createdBy?: number;
  }): Promise<{ webhook: Webhook; secret: string }> {
    const secret = randomBytes(32).toString('hex');
    const webhook = this.webhookRepo.create({
      name: data.name,
      url: data.url,
      events: data.events.join(','),
      secret,
      createdBy: data.createdBy || null,
    });
    const saved = await this.webhookRepo.save(webhook);
    return { webhook: saved, secret };
  }

  async list(): Promise<Webhook[]> {
    return this.webhookRepo.find({ order: { createdAt: 'DESC' } });
  }

  async delete(webhookId: string): Promise<void> {
    const wh = await this.webhookRepo.findOne({ where: { webhookId } });
    if (!wh) throw new NotFoundException('Webhook not found');
    wh.active = false;
    await this.webhookRepo.save(wh);
  }

  async getLogs(webhookId?: string, limit = 50): Promise<WebhookLog[]> {
    const where: any = {};
    if (webhookId) where.webhookId = webhookId;
    return this.logRepo.find({ where, order: { deliveredAt: 'DESC' }, take: limit });
  }

  getAvailableEvents(): string[] {
    return [...WEBHOOK_EVENTS];
  }

  // ── Dispatch ──

  async dispatch(event: WebhookEvent, payload: Record<string, any>): Promise<void> {
    const webhooks = await this.webhookRepo.find({ where: { active: true } });
    const matching = webhooks.filter((w) => w.events.split(',').includes(event));

    for (const webhook of matching) {
      this.deliverAsync(webhook, event, payload);
    }

    if (matching.length > 0) {
      this.logger.log(`Dispatched "${event}" to ${matching.length} webhook(s)`);
    }
  }

  private async deliverAsync(
    webhook: Webhook,
    event: string,
    payload: Record<string, any>,
  ): Promise<void> {
    const body = JSON.stringify({
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': event,
      'X-Webhook-Id': webhook.webhookId,
    };

    // Sign payload with HMAC-SHA256 if secret is set
    if (webhook.secret) {
      const signature = createHmac('sha256', webhook.secret)
        .update(body)
        .digest('hex');
      headers['X-Webhook-Signature'] = `sha256=${signature}`;
    }

    const start = Date.now();
    let statusCode = 0;
    let responseBody = '';
    let error = '';
    let success = false;

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      statusCode = response.status;
      responseBody = (await response.text()).substring(0, 1000);
      success = response.ok;
    } catch (err: any) {
      error = err.message;
      this.logger.warn(`Webhook delivery failed to ${webhook.url}: ${err.message}`);
    }

    // Log delivery
    await this.logRepo.save(
      this.logRepo.create({
        webhookId: webhook.webhookId,
        event,
        url: webhook.url,
        statusCode,
        success,
        requestBody: body.substring(0, 2000),
        responseBody: responseBody || null,
        error: error || null,
        durationMs: Date.now() - start,
      }),
    );
  }
}
