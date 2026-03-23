import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Tenant, PlanTier, TenantStatus } from './entities/tenant.entity.js';
import { TenantApiKey } from './entities/tenant-api-key.entity.js';
import { SignupDto } from './dto/create-tenant.dto.js';
import { CreateApiKeyDto, VALID_SCOPES } from './dto/create-api-key.dto.js';
import { AuthService } from '../auth/auth.service.js';
import { Role } from '../common/constants/roles.constants.js';

const PLAN_LIMITS: Record<PlanTier, { dailyApi: number; monthlyHl7: number; maxPatients: number; maxEndpoints: number; maxUsers: number }> = {
  [PlanTier.FREE]: { dailyApi: 100, monthlyHl7: 50, maxPatients: 5, maxEndpoints: 1, maxUsers: 1 },
  [PlanTier.PAYGO]: { dailyApi: 10_000, monthlyHl7: 5_000, maxPatients: 1_000, maxEndpoints: 5, maxUsers: 5 },
  [PlanTier.PRO]: { dailyApi: 100_000, monthlyHl7: 50_000, maxPatients: 10_000, maxEndpoints: 20, maxUsers: 25 },
  [PlanTier.ENTERPRISE]: { dailyApi: 1_000_000, monthlyHl7: 500_000, maxPatients: 100_000, maxEndpoints: 100, maxUsers: 100 },
};

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(TenantApiKey)
    private readonly apiKeyRepo: Repository<TenantApiKey>,
    private readonly authService: AuthService,
  ) {}

  async signup(dto: SignupDto): Promise<{ tenant: Tenant; user: any; apiKey: string }> {
    // Check for existing tenant with same email
    const existing = await this.tenantRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    // Create slug from org name
    const slug = dto.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existingSlug = await this.tenantRepo.findOne({ where: { slug } });
    if (existingSlug) {
      throw new ConflictException('Organization name is already taken');
    }

    // Create tenant
    const limits = PLAN_LIMITS[PlanTier.FREE];
    const tenant = this.tenantRepo.create({
      name: dto.organizationName,
      slug,
      email: dto.email,
      plan: PlanTier.FREE,
      status: TenantStatus.ACTIVE,
      dailyApiLimit: limits.dailyApi,
      monthlyHl7Limit: limits.monthlyHl7,
      maxSimulatedPatients: limits.maxPatients,
      maxEndpoints: limits.maxEndpoints,
      maxUsers: limits.maxUsers,
    });
    const savedTenant = await this.tenantRepo.save(tenant);

    // Create admin user for this tenant
    const user = await this.authService.createUser({
      username: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: Role.ADMIN,
      email: dto.email,
      tenantId: savedTenant.id,
    });

    // Generate initial API key
    const { rawKey, apiKey } = await this.createApiKeyInternal(savedTenant, {
      name: 'Default Key',
      scopes: [...VALID_SCOPES],
    });

    return {
      tenant: savedTenant,
      user: {
        uuid: user.uuid,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      apiKey: rawKey,
    };
  }

  async findByUuid(uuid: string): Promise<Tenant | null> {
    return this.tenantRepo.findOne({ where: { uuid } });
  }

  async findById(id: number): Promise<Tenant | null> {
    return this.tenantRepo.findOne({ where: { id } });
  }

  // --- API Key Management ---

  async createApiKey(
    tenant: Tenant,
    dto: CreateApiKeyDto,
  ): Promise<{ apiKey: TenantApiKey; rawKey: string }> {
    // Validate scopes
    const invalidScopes = dto.scopes.filter(
      (s) => !VALID_SCOPES.includes(s as any),
    );
    if (invalidScopes.length > 0) {
      throw new BadRequestException(
        `Invalid scopes: ${invalidScopes.join(', ')}`,
      );
    }

    const { rawKey, apiKey } = await this.createApiKeyInternal(tenant, {
      name: dto.name,
      scopes: dto.scopes,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });

    return { apiKey, rawKey };
  }

  async listApiKeys(tenant: Tenant): Promise<TenantApiKey[]> {
    return this.apiKeyRepo.find({
      where: { tenantId: tenant.id },
      order: { createdAt: 'DESC' },
    });
  }

  async revokeApiKey(tenant: Tenant, keyUuid: string): Promise<void> {
    const key = await this.apiKeyRepo.findOne({
      where: { uuid: keyUuid, tenantId: tenant.id },
    });
    if (!key) throw new NotFoundException('API key not found');
    key.active = false;
    await this.apiKeyRepo.save(key);
  }

  async validateApiKey(rawKey: string): Promise<{ tenant: Tenant; apiKey: TenantApiKey } | null> {
    // Key format: oet_<prefix>_<secret>
    const parts = rawKey.split('_');
    if (parts.length !== 3 || parts[0] !== 'oet') return null;

    const prefix = `oet_${parts[1]}`;
    const apiKey = await this.apiKeyRepo.findOne({
      where: { keyPrefix: prefix, active: true },
      relations: ['tenant'],
    });
    if (!apiKey) return null;

    // Check expiry
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

    // Check tenant status
    if (apiKey.tenant.status !== TenantStatus.ACTIVE) return null;

    // Verify hash
    const valid = await bcrypt.compare(rawKey, apiKey.keyHash);
    if (!valid) return null;

    // Update last used
    apiKey.lastUsedAt = new Date();
    await this.apiKeyRepo.save(apiKey);

    return { tenant: apiKey.tenant, apiKey };
  }

  async getTenant(uuid: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { uuid } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async updatePlan(tenant: Tenant, plan: PlanTier): Promise<Tenant> {
    const limits = PLAN_LIMITS[plan];
    tenant.plan = plan;
    tenant.dailyApiLimit = limits.dailyApi;
    tenant.monthlyHl7Limit = limits.monthlyHl7;
    tenant.maxSimulatedPatients = limits.maxPatients;
    tenant.maxEndpoints = limits.maxEndpoints;
    tenant.maxUsers = limits.maxUsers;
    return this.tenantRepo.save(tenant);
  }

  // --- Internal helpers ---

  private async createApiKeyInternal(
    tenant: Tenant,
    opts: { name: string; scopes: readonly string[] | string[]; expiresAt?: Date },
  ): Promise<{ rawKey: string; apiKey: TenantApiKey }> {
    const prefix = `oet_${crypto.randomBytes(6).toString('hex')}`;
    const secret = crypto.randomBytes(24).toString('hex');
    const rawKey = `${prefix}_${secret}`;
    const keyHash = await bcrypt.hash(rawKey, 10);

    const apiKey = this.apiKeyRepo.create({
      name: opts.name,
      keyPrefix: prefix,
      keyHash,
      scopes: [...opts.scopes],
      tenantId: tenant.id,
      expiresAt: opts.expiresAt || null,
    });
    const saved = await this.apiKeyRepo.save(apiKey);

    return { rawKey, apiKey: saved };
  }
}
