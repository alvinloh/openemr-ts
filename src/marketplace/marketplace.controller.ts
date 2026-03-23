import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiQuery } from '@nestjs/swagger';
import { MarketplaceService } from './marketplace.service.js';
import { TenantGuard } from '../tenant/guards/tenant.guard.js';

@ApiTags('Marketplace')
@Controller('api/marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('templates')
  @ApiOperation({ summary: 'Browse public workflow templates' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async listTemplates(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.marketplaceService.listPublic({ category, search, limit, offset });
  }

  @Get('templates/:slug')
  @ApiOperation({ summary: 'Get a workflow template by slug' })
  async getTemplate(@Param('slug') slug: string) {
    const template = await this.marketplaceService.getBySlug(slug);
    await this.marketplaceService.recordDownload(slug);
    return {
      ...template,
      definition: JSON.parse(template.definition),
    };
  }

  @Get('categories')
  @ApiOperation({ summary: 'List marketplace categories' })
  async getCategories() {
    return this.marketplaceService.getCategories();
  }

  @Post('templates')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'Publish a workflow template to the marketplace' })
  @ApiHeader({ name: 'x-api-key', description: 'Tenant API key' })
  async publishTemplate(
    @Request() req: any,
    @Body() body: {
      name: string;
      description?: string;
      category: string;
      definition: any;
      price?: number;
      tags?: string[];
    },
  ) {
    const template = await this.marketplaceService.publish(
      req.tenant.id,
      req.tenant.name,
      body,
    );
    return {
      slug: template.slug,
      name: template.name,
      category: template.category,
      price: template.price,
      hl7MessageTypes: template.hl7MessageTypes,
    };
  }

  @Get('my-templates')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'List templates published by your tenant' })
  @ApiHeader({ name: 'x-api-key', description: 'Tenant API key' })
  async myTemplates(@Request() req: any) {
    return this.marketplaceService.listByTenant(req.tenant.id);
  }
}
