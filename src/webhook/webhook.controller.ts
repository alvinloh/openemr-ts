import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebhookService } from './webhook.service.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ApiResponse } from '../common/dto/api-response.dto.js';

@ApiTags('Webhooks')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get('events')
  @ApiOperation({ summary: 'List available webhook events' })
  async getEvents() {
    return ApiResponse.ok(this.webhookService.getAvailableEvents());
  }

  @Get()
  @ApiOperation({ summary: 'List registered webhooks' })
  async list() {
    return ApiResponse.ok(await this.webhookService.list());
  }

  @Post()
  @ApiOperation({ summary: 'Register a webhook' })
  async create(
    @Body() body: { name: string; url: string; events: string[] },
    @CurrentUser('id') userId: number,
  ) {
    const result = await this.webhookService.create({
      name: body.name,
      url: body.url,
      events: body.events,
      createdBy: userId,
    });
    return {
      message: 'Webhook registered. Save the signing secret.',
      webhook: {
        webhookId: result.webhook.webhookId,
        name: result.webhook.name,
        url: result.webhook.url,
        events: result.webhook.events,
      },
      secret: result.secret,
    };
  }

  @Delete(':webhookId')
  @ApiOperation({ summary: 'Deactivate a webhook' })
  async delete(@Param('webhookId') webhookId: string) {
    await this.webhookService.delete(webhookId);
    return { message: 'Webhook deactivated' };
  }

  @Get('logs')
  @ApiOperation({ summary: 'View webhook delivery logs' })
  async getLogs(@Query('webhookId') webhookId?: string) {
    return ApiResponse.ok(await this.webhookService.getLogs(webhookId));
  }

  @Post('replay/:logId')
  @ApiOperation({ summary: 'Replay a webhook delivery from logs' })
  async replay(@Param('logId') logId: string) {
    const result = await this.webhookService.replay(parseInt(logId, 10));
    return { message: result.success ? 'Replay successful' : 'Replay failed', ...result };
  }

  @Post('test')
  @ApiOperation({ summary: 'Send a test event to a webhook' })
  async test(@Body() body: { webhookId: string }) {
    const webhooks = await this.webhookService.list();
    const wh = webhooks.find((w) => w.webhookId === body.webhookId);
    if (!wh) return { error: 'Webhook not found' };

    await this.webhookService.dispatch('lab.order.created' as any, {
      test: true,
      message: 'This is a test webhook delivery from OpenEMR-TS',
      orderId: 0,
      timestamp: new Date().toISOString(),
    });

    return { message: 'Test event dispatched' };
  }
}
