import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Socket } from 'net';
import { Endpoint, EndpointTransport, EndpointStatus } from './entities/endpoint.entity.js';
import { CreateEndpointDto } from './dto/create-endpoint.dto.js';
import { Tenant } from '../tenant/entities/tenant.entity.js';
import { encrypt, decrypt } from '../common/utils/crypto.util.js';

// MLLP framing characters
const VT = String.fromCharCode(0x0b);
const FS = String.fromCharCode(0x1c);
const CR = String.fromCharCode(0x0d);

export interface EndpointSendResult {
  success: boolean;
  endpointName: string;
  transport: string;
  destination: string;
  ack?: string;
  error?: string;
  sentAt: string;
  retryCount: number;
}

@Injectable()
export class EndpointService {
  private readonly logger = new Logger(EndpointService.name);

  constructor(
    @InjectRepository(Endpoint)
    private readonly endpointRepo: Repository<Endpoint>,
  ) {}

  async create(tenant: Tenant, dto: CreateEndpointDto): Promise<Endpoint> {
    // Check endpoint limit
    const count = await this.endpointRepo.count({ where: { tenantId: tenant.id } });
    if (count >= tenant.maxEndpoints) {
      throw new BadRequestException(
        `Endpoint limit reached (${tenant.maxEndpoints}). Upgrade your plan for more endpoints.`,
      );
    }

    const encryptionKey = process.env.ENCRYPTION_KEY || '';
    const endpoint = this.endpointRepo.create({
      name: dto.name,
      description: dto.description || null,
      transport: dto.transport,
      host: dto.host || null,
      port: dto.port || null,
      url: dto.url || null,
      authHeaderEncrypted: dto.authHeader
        ? encrypt(dto.authHeader, encryptionKey)
        : null,
      maxRetries: dto.maxRetries ?? 3,
      timeoutMs: dto.timeoutMs ?? 5000,
      messageTypes: dto.messageTypes || null,
      tenantId: tenant.id,
    });

    return this.endpointRepo.save(endpoint);
  }

  async list(tenantId: number): Promise<Endpoint[]> {
    return this.endpointRepo.find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  async findByName(tenantId: number, name: string): Promise<Endpoint> {
    const endpoint = await this.endpointRepo.findOne({
      where: { tenantId, name },
    });
    if (!endpoint) throw new NotFoundException(`Endpoint "${name}" not found`);
    return endpoint;
  }

  async findByUuid(tenantId: number, uuid: string): Promise<Endpoint> {
    const endpoint = await this.endpointRepo.findOne({
      where: { tenantId, uuid },
    });
    if (!endpoint) throw new NotFoundException('Endpoint not found');
    return endpoint;
  }

  async update(tenantId: number, uuid: string, dto: Partial<CreateEndpointDto>): Promise<Endpoint> {
    const endpoint = await this.findByUuid(tenantId, uuid);
    const encryptionKey = process.env.ENCRYPTION_KEY || '';

    if (dto.name !== undefined) endpoint.name = dto.name;
    if (dto.description !== undefined) endpoint.description = dto.description || null;
    if (dto.transport !== undefined) endpoint.transport = dto.transport;
    if (dto.host !== undefined) endpoint.host = dto.host || null;
    if (dto.port !== undefined) endpoint.port = dto.port || null;
    if (dto.url !== undefined) endpoint.url = dto.url || null;
    if (dto.authHeader !== undefined) {
      endpoint.authHeaderEncrypted = dto.authHeader
        ? encrypt(dto.authHeader, encryptionKey)
        : null;
    }
    if (dto.maxRetries !== undefined) endpoint.maxRetries = dto.maxRetries;
    if (dto.timeoutMs !== undefined) endpoint.timeoutMs = dto.timeoutMs;
    if (dto.messageTypes !== undefined) endpoint.messageTypes = dto.messageTypes || null;

    return this.endpointRepo.save(endpoint);
  }

  async remove(tenantId: number, uuid: string): Promise<void> {
    const endpoint = await this.findByUuid(tenantId, uuid);
    await this.endpointRepo.remove(endpoint);
  }

  /**
   * Send an HL7 message to a tenant's endpoint with retry and circuit breaker logic
   */
  async sendToEndpoint(endpoint: Endpoint, hl7Message: string): Promise<EndpointSendResult> {
    // Circuit breaker — skip unhealthy endpoints
    if (endpoint.status === EndpointStatus.UNHEALTHY && endpoint.consecutiveFailures >= 10) {
      return {
        success: false,
        endpointName: endpoint.name,
        transport: endpoint.transport,
        destination: this.getDestination(endpoint),
        error: 'Endpoint is unhealthy (circuit breaker open). Will retry after health check.',
        sentAt: new Date().toISOString(),
        retryCount: 0,
      };
    }

    let lastError: string | undefined;
    for (let attempt = 0; attempt <= endpoint.maxRetries; attempt++) {
      try {
        const result = await this.sendOnce(endpoint, hl7Message);

        // Update health tracking on success
        endpoint.consecutiveFailures = 0;
        endpoint.lastSuccessAt = new Date();
        endpoint.status = EndpointStatus.ACTIVE;
        await this.endpointRepo.save(endpoint);

        return {
          success: true,
          endpointName: endpoint.name,
          transport: endpoint.transport,
          destination: this.getDestination(endpoint),
          ack: result,
          sentAt: new Date().toISOString(),
          retryCount: attempt,
        };
      } catch (err: any) {
        lastError = err.message;
        this.logger.warn(
          `Endpoint "${endpoint.name}" attempt ${attempt + 1}/${endpoint.maxRetries + 1} failed: ${err.message}`,
        );
        if (attempt < endpoint.maxRetries) {
          await this.delay(1000 * (attempt + 1)); // Exponential backoff
        }
      }
    }

    // All retries exhausted
    endpoint.consecutiveFailures++;
    endpoint.lastFailureAt = new Date();
    if (endpoint.consecutiveFailures >= 5) {
      endpoint.status = EndpointStatus.UNHEALTHY;
    }
    await this.endpointRepo.save(endpoint);

    return {
      success: false,
      endpointName: endpoint.name,
      transport: endpoint.transport,
      destination: this.getDestination(endpoint),
      error: lastError,
      sentAt: new Date().toISOString(),
      retryCount: endpoint.maxRetries,
    };
  }

  /**
   * Send HL7 message to all matching endpoints for a tenant
   */
  async sendToTenantEndpoints(
    tenantId: number,
    hl7Message: string,
    messageType?: string,
  ): Promise<EndpointSendResult[]> {
    const endpoints = await this.endpointRepo.find({
      where: { tenantId, status: EndpointStatus.ACTIVE },
    });

    // Filter by message type if endpoint has type restrictions
    const matching = endpoints.filter((ep) => {
      if (!ep.messageTypes || ep.messageTypes.length === 0) return true;
      if (!messageType) return true;
      return ep.messageTypes.some(
        (t) => messageType.startsWith(t) || messageType === t,
      );
    });

    if (matching.length === 0) {
      return [];
    }

    return Promise.all(
      matching.map((ep) => this.sendToEndpoint(ep, hl7Message)),
    );
  }

  async healthCheck(endpoint: Endpoint): Promise<boolean> {
    try {
      if (endpoint.transport === EndpointTransport.MLLP) {
        await this.checkMllpHealth(endpoint);
      } else {
        await this.checkHttpHealth(endpoint);
      }
      endpoint.lastHealthCheck = new Date();
      endpoint.status = EndpointStatus.ACTIVE;
      endpoint.consecutiveFailures = 0;
      await this.endpointRepo.save(endpoint);
      return true;
    } catch {
      endpoint.lastHealthCheck = new Date();
      endpoint.consecutiveFailures++;
      if (endpoint.consecutiveFailures >= 5) {
        endpoint.status = EndpointStatus.UNHEALTHY;
      }
      await this.endpointRepo.save(endpoint);
      return false;
    }
  }

  // --- Transport implementations ---

  private async sendOnce(endpoint: Endpoint, hl7Message: string): Promise<string> {
    switch (endpoint.transport) {
      case EndpointTransport.MLLP:
        return this.sendMllp(endpoint, hl7Message);
      case EndpointTransport.HTTP:
      case EndpointTransport.HTTPS:
        return this.sendHttp(endpoint, hl7Message);
      default:
        throw new Error(`Unsupported transport: ${endpoint.transport}`);
    }
  }

  private sendMllp(endpoint: Endpoint, message: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!endpoint.host || !endpoint.port) {
        reject(new Error('MLLP endpoint missing host or port'));
        return;
      }

      const socket = new Socket();
      let ackData = '';

      socket.setTimeout(endpoint.timeoutMs);

      socket.connect(endpoint.port, endpoint.host, () => {
        socket.write(VT + message + FS + CR);
      });

      socket.on('data', (data) => {
        ackData += data.toString();
        if (ackData.includes(FS)) {
          socket.end();
          resolve(ackData.replace(VT, '').replace(FS, '').replace(CR, '').trim());
        }
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve('(no ACK — timeout)');
      });

      socket.on('error', (err) => {
        socket.destroy();
        reject(err);
      });
    });
  }

  private async sendHttp(endpoint: Endpoint, message: string): Promise<string> {
    if (!endpoint.url) {
      throw new Error('HTTP endpoint missing URL');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/hl7-v2',
      'Accept': 'application/hl7-v2',
    };

    // Decrypt and add auth header if present
    if (endpoint.authHeaderEncrypted) {
      try {
        const encryptionKey = process.env.ENCRYPTION_KEY || '';
        const authHeader = decrypt(endpoint.authHeaderEncrypted, encryptionKey);
        headers['Authorization'] = authHeader;
      } catch {
        this.logger.warn(`Failed to decrypt auth header for endpoint "${endpoint.name}"`);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), endpoint.timeoutMs);

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: message,
        signal: controller.signal,
      });
      const ack = await response.text();
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${ack.substring(0, 200)}`);
      }
      return ack;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private checkMllpHealth(endpoint: Endpoint): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!endpoint.host || !endpoint.port) {
        reject(new Error('Missing host/port'));
        return;
      }
      const socket = new Socket();
      socket.setTimeout(3000);
      socket.connect(endpoint.port, endpoint.host, () => {
        socket.end();
        resolve();
      });
      socket.on('timeout', () => { socket.destroy(); reject(new Error('Timeout')); });
      socket.on('error', (err) => { socket.destroy(); reject(err); });
    });
  }

  private async checkHttpHealth(endpoint: Endpoint): Promise<void> {
    if (!endpoint.url) throw new Error('Missing URL');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch(endpoint.url, {
        method: 'HEAD',
        signal: controller.signal,
      });
      if (!response.ok && response.status !== 405) {
        throw new Error(`HTTP ${response.status}`);
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private getDestination(endpoint: Endpoint): string {
    if (endpoint.transport === EndpointTransport.MLLP) {
      return `${endpoint.host}:${endpoint.port}`;
    }
    return endpoint.url || 'unknown';
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
