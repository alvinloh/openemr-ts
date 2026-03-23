import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowTemplate } from './entities/workflow-template.entity.js';

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(WorkflowTemplate)
    private readonly templateRepo: Repository<WorkflowTemplate>,
  ) {}

  async listPublic(opts?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: WorkflowTemplate[]; total: number }> {
    const qb = this.templateRepo.createQueryBuilder('t').where('t.isPublic = true');

    if (opts?.category) {
      qb.andWhere('t.category = :category', { category: opts.category });
    }
    if (opts?.search) {
      qb.andWhere('(t.name LIKE :search OR t.description LIKE :search)', {
        search: `%${opts.search}%`,
      });
    }

    qb.orderBy('t.downloadCount', 'DESC')
      .skip(opts?.offset || 0)
      .take(opts?.limit || 20);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async getBySlug(slug: string): Promise<WorkflowTemplate> {
    const template = await this.templateRepo.findOne({ where: { slug, isPublic: true } });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async publish(tenantId: number, tenantName: string, data: {
    name: string;
    description?: string;
    category: string;
    definition: any;
    price?: number;
    tags?: string[];
  }): Promise<WorkflowTemplate> {
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existing = await this.templateRepo.findOne({ where: { slug } });
    if (existing) {
      throw new BadRequestException('A template with this name already exists');
    }

    const template = this.templateRepo.create({
      name: data.name,
      slug,
      description: data.description || null,
      category: data.category,
      definition: JSON.stringify(data.definition),
      authorTenantId: tenantId,
      authorName: tenantName,
      isPublic: true,
      price: data.price || 0,
      tags: data.tags || null,
      hl7MessageTypes: this.extractHl7Types(data.definition),
    });

    return this.templateRepo.save(template);
  }

  async recordDownload(slug: string): Promise<void> {
    await this.templateRepo
      .createQueryBuilder()
      .update()
      .set({ downloadCount: () => 'downloadCount + 1' })
      .where('slug = :slug', { slug })
      .execute();
  }

  async listByTenant(tenantId: number): Promise<WorkflowTemplate[]> {
    return this.templateRepo.find({
      where: { authorTenantId: tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async getCategories(): Promise<string[]> {
    const results = await this.templateRepo
      .createQueryBuilder('t')
      .select('DISTINCT t.category', 'category')
      .where('t.isPublic = true')
      .getRawMany();
    return results.map((r) => r.category);
  }

  private extractHl7Types(definition: any): string[] {
    if (!Array.isArray(definition)) return [];
    const typeMap: Record<string, string> = {
      register: 'ADT^A04',
      checkin: 'ADT^A01',
      discharge: 'ADT^A03',
      'order-labs': 'ORM^O01',
      'receive-results': 'ORU^R01',
      'schedule-followup': 'SIU^S12',
      prescribe: 'RDE^O11',
    };
    return [...new Set(definition.map((step: any) => typeMap[step] || step).filter(Boolean))];
  }
}
