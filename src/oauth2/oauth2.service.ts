import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { OAuth2Client } from './entities/oauth2-client.entity.js';
import { OAuth2Token } from './entities/oauth2-token.entity.js';
import { RegisterClientDto } from './dto/register-client.dto.js';

// Valid FHIR scopes
const VALID_SCOPES = [
  // Patient-level (requires patient context)
  'patient/Patient.rs', 'patient/Patient.cruds',
  'patient/Encounter.rs', 'patient/Encounter.cruds',
  'patient/Observation.rs', 'patient/Observation.cruds',
  'patient/MedicationRequest.rs', 'patient/MedicationRequest.cruds',
  'patient/Condition.rs', 'patient/Condition.cruds',
  'patient/AllergyIntolerance.rs', 'patient/AllergyIntolerance.cruds',
  'patient/Appointment.rs', 'patient/Appointment.cruds',
  'patient/DocumentReference.rs', 'patient/DocumentReference.cruds',
  'patient/Procedure.rs', 'patient/Procedure.cruds',
  // System-level (no patient context, full access)
  'system/Patient.rs', 'system/Patient.cruds',
  'system/Encounter.rs', 'system/Encounter.cruds',
  'system/Observation.rs', 'system/Observation.cruds',
  'system/MedicationRequest.rs', 'system/MedicationRequest.cruds',
  'system/Condition.rs', 'system/Condition.cruds',
  'system/AllergyIntolerance.rs', 'system/AllergyIntolerance.cruds',
  'system/Appointment.rs', 'system/Appointment.cruds',
  'system/DocumentReference.rs', 'system/DocumentReference.cruds',
  'system/Procedure.rs', 'system/Procedure.cruds',
];

@Injectable()
export class OAuth2Service {
  private readonly logger = new Logger(OAuth2Service.name);

  constructor(
    @InjectRepository(OAuth2Client)
    private readonly clientRepo: Repository<OAuth2Client>,
    @InjectRepository(OAuth2Token)
    private readonly tokenRepo: Repository<OAuth2Token>,
    private readonly jwtService: JwtService,
  ) {}

  // ── Client Registration ──

  async registerClient(
    dto: RegisterClientDto,
    registeredBy?: number,
  ): Promise<{ client: Partial<OAuth2Client>; clientSecret: string }> {
    // Validate scopes
    for (const scope of dto.scopes) {
      if (!VALID_SCOPES.includes(scope)) {
        throw new BadRequestException(
          `Invalid scope: "${scope}". Valid scopes: ${VALID_SCOPES.join(', ')}`,
        );
      }
    }

    // Generate a raw secret (shown once to the caller)
    const rawSecret = randomBytes(32).toString('hex');
    const hashedSecret = await bcrypt.hash(rawSecret, 10);

    const client = this.clientRepo.create({
      name: dto.name,
      description: dto.description || null,
      redirectUri: dto.redirectUri || null,
      scopes: dto.scopes.join(','),
      grantTypes: (dto.grantTypes || ['client_credentials']).join(','),
      clientSecret: hashedSecret,
      registeredBy: registeredBy || null,
    });

    const saved = await this.clientRepo.save(client);
    this.logger.log(`Registered OAuth2 client "${saved.name}" (${saved.clientId})`);

    return {
      client: {
        clientId: saved.clientId,
        name: saved.name,
        scopes: saved.scopes,
        grantTypes: saved.grantTypes,
        active: saved.active,
        createdAt: saved.createdAt,
      },
      clientSecret: rawSecret, // Only shown once!
    };
  }

  async listClients(): Promise<Partial<OAuth2Client>[]> {
    const clients = await this.clientRepo.find({ order: { createdAt: 'DESC' } });
    return clients.map((c) => ({
      id: c.id,
      clientId: c.clientId,
      name: c.name,
      description: c.description,
      scopes: c.scopes,
      grantTypes: c.grantTypes,
      active: c.active,
      createdAt: c.createdAt,
    }));
  }

  async revokeClient(clientId: string): Promise<void> {
    const client = await this.clientRepo.findOne({ where: { clientId } });
    if (!client) throw new NotFoundException('Client not found');
    client.active = false;
    await this.clientRepo.save(client);
    // Revoke all active tokens for this client
    await this.tokenRepo.update({ clientId, revoked: false }, { revoked: true });
    this.logger.log(`Revoked OAuth2 client "${client.name}" (${clientId})`);
  }

  // ── Token Generation ──

  async generateToken(
    clientId: string,
    clientSecret: string,
    grantType: string,
    requestedScope?: string,
  ): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
  }> {
    if (grantType !== 'client_credentials') {
      throw new BadRequestException(
        'Unsupported grant_type. Supported: client_credentials',
      );
    }

    // Find and validate client
    const client = await this.clientRepo.findOne({ where: { clientId } });
    if (!client || !client.active) {
      throw new UnauthorizedException('Invalid client_id');
    }

    // Verify secret
    const secretValid = await bcrypt.compare(clientSecret, client.clientSecret);
    if (!secretValid) {
      throw new UnauthorizedException('Invalid client_secret');
    }

    // Check grant type is allowed
    const allowedGrants = client.grantTypes.split(',');
    if (!allowedGrants.includes(grantType)) {
      throw new BadRequestException(
        `Grant type "${grantType}" not allowed for this client`,
      );
    }

    // Resolve scopes — requested must be subset of registered
    const registeredScopes = client.scopes.split(',');
    let grantedScopes: string[];

    if (requestedScope) {
      const requested = requestedScope.split(' ').filter(Boolean);
      const invalid = requested.filter((s) => !registeredScopes.includes(s));
      if (invalid.length > 0) {
        throw new BadRequestException(
          `Requested scope(s) not granted to this client: ${invalid.join(', ')}`,
        );
      }
      grantedScopes = requested;
    } else {
      grantedScopes = registeredScopes;
    }

    const expiresInSeconds = 3600; // 1 hour
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    // Create JWT
    const payload = {
      sub: client.clientId,
      client_name: client.name,
      scope: grantedScopes.join(' '),
      type: 'oauth2_client',
    };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: expiresInSeconds,
    });

    // Store token record
    await this.tokenRepo.save(
      this.tokenRepo.create({
        accessToken,
        clientId: client.clientId,
        scopes: grantedScopes.join(','),
        expiresAt,
      }),
    );

    this.logger.log(
      `Issued token for client "${client.name}" (${client.clientId}), scopes: ${grantedScopes.join(' ')}`,
    );

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: expiresInSeconds,
      scope: grantedScopes.join(' '),
    };
  }

  // ── Token Validation (used by guard) ──

  async validateToken(
    token: string,
  ): Promise<{ clientId: string; scopes: string[]; clientName: string } | null> {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'oauth2_client') return null;

      // Check token isn't revoked
      const tokenRecord = await this.tokenRepo.findOne({
        where: { accessToken: token, revoked: false, expiresAt: MoreThan(new Date()) },
      });
      if (!tokenRecord) return null;

      // Check client is still active
      const client = await this.clientRepo.findOne({
        where: { clientId: payload.sub, active: true },
      });
      if (!client) return null;

      return {
        clientId: payload.sub,
        scopes: payload.scope.split(' '),
        clientName: payload.client_name,
      };
    } catch {
      return null;
    }
  }

  // ── Token Introspection ──

  async introspectToken(token: string): Promise<Record<string, any>> {
    const result = await this.validateToken(token);
    if (!result) {
      return { active: false };
    }
    const payload = this.jwtService.decode(token) as any;
    return {
      active: true,
      client_id: result.clientId,
      client_name: result.clientName,
      scope: result.scopes.join(' '),
      token_type: 'Bearer',
      exp: payload.exp,
      iat: payload.iat,
    };
  }

  // ── Scope Checking ──

  checkScope(scopes: string[], resourceType: string, action: 'read' | 'search' | 'create' | 'update' | 'delete'): boolean {
    const actionChar = action[0]; // r, s, c, u, d
    return scopes.some((scope) => {
      const parts = scope.split('/');
      if (parts.length !== 2) return false;
      const [context, resourceAndPerms] = parts;
      const dotIdx = resourceAndPerms.indexOf('.');
      if (dotIdx < 0) return false;
      const scopeResource = resourceAndPerms.substring(0, dotIdx);
      const perms = resourceAndPerms.substring(dotIdx + 1);
      return scopeResource === resourceType && perms.includes(actionChar);
    });
  }

  getValidScopes(): string[] {
    return VALID_SCOPES;
  }
}
