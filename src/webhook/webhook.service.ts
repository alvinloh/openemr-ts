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
    tenantId?: number;
    filters?: Record<string, string>;
  }): Promise<{ webhook: Webhook; secret: string }> {
    const secret = randomBytes(32).toString('hex');
    const webhook = this.webhookRepo.create({
      name: data.name,
      url: data.url,
      events: data.events.join(','),
      secret,
      createdBy: data.createdBy || null,
      tenantId: data.tenantId || null,
      filters: data.filters ? JSON.stringify(data.filters) : null,
    });
    const saved = await this.webhookRepo.save(webhook);
    return { webhook: saved, secret };
  }

  async list(tenantId?: number): Promise<Webhook[]> {
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;
    return this.webhookRepo.find({ where, order: { createdAt: 'DESC' } });
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

  async replay(logId: number): Promise<{ success: boolean; statusCode: number }> {
    const log = await this.logRepo.findOne({ where: { id: logId } });
    if (!log) throw new NotFoundException('Webhook log entry not found');

    const webhook = await this.webhookRepo.findOne({ where: { webhookId: log.webhookId } });
    if (!webhook) throw new NotFoundException('Webhook no longer exists');

    // Re-deliver the original payload
    const start = Date.now();
    let statusCode = 0;
    let responseBody = '';
    let error = '';
    let success = false;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': log.event,
        'X-Webhook-Id': log.webhookId,
        'X-Webhook-Replay': 'true',
      };

      if (webhook.secret && log.requestBody) {
        const signature = createHmac('sha256', webhook.secret)
          .update(log.requestBody)
          .digest('hex');
        headers['X-Webhook-Signature'] = `sha256=${signature}`;
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: log.requestBody || '{}',
        signal: AbortSignal.timeout(10000),
      });

      statusCode = response.status;
      responseBody = (await response.text()).substring(0, 1000);
      success = response.ok;
    } catch (err: any) {
      error = err.message;
    }

    // Log the replay
    await this.logRepo.save(
      this.logRepo.create({
        webhookId: log.webhookId,
        event: `${log.event}(replay)`,
        url: webhook.url,
        statusCode,
        success,
        requestBody: log.requestBody,
        responseBody: responseBody || null,
        error: error || null,
        durationMs: Date.now() - start,
      }),
    );

    return { success, statusCode };
  }

  getAvailableEvents(): string[] {
    return [...WEBHOOK_EVENTS];
  }

  // ── Dispatch ──

  async dispatch(event: WebhookEvent, payload: Record<string, any>, tenantId?: number): Promise<void> {
    const where: any = { active: true };
    if (tenantId) where.tenantId = tenantId;
    const webhooks = await this.webhookRepo.find({ where });
    let matching = webhooks.filter((w) => w.events.split(',').includes(event));

    // Apply filters — if webhook has filters, check that payload matches
    matching = matching.filter((w) => {
      if (!w.filters) return true;
      try {
        const filters = JSON.parse(w.filters) as Record<string, string>;
        return Object.entries(filters).every(
          ([key, value]) => String(payload[key]) === String(value),
        );
      } catch {
        return true;
      }
    });

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
