import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { PatientModule } from './patient/patient.module.js';
import { EncounterModule } from './encounter/encounter.module.js';
import { MedicationModule } from './medication/medication.module.js';
import { LabModule } from './lab/lab.module.js';
import { SchedulingModule } from './scheduling/scheduling.module.js';
import { BillingModule } from './billing/billing.module.js';
import { DocumentModule } from './document/document.module.js';
import { FhirModule } from './fhir/fhir.module.js';
import { Hl7Module } from './hl7/hl7.module.js';
import { DicomModule } from './dicom/dicom.module.js';
import { PdfModule } from './pdf/pdf.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { OAuth2Module } from './oauth2/oauth2.module.js';
import { WebhookModule } from './webhook/webhook.module.js';
import { TenantModule } from './tenant/tenant.module.js';
import { MeteringModule } from './metering/metering.module.js';
import { SimulationModule } from './simulation/simulation.module.js';
import { EndpointModule } from './endpoint/endpoint.module.js';
import { McpModule } from './mcp/mcp.module.js';
import { BillingStripeModule } from './billing-stripe/billing-stripe.module.js';

@Module({
  imports: [
    // Load .env
    ConfigModule.forRoot({ isGlobal: true }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.get<string>('DB_HOST') ?? 'localhost',
        port: parseInt(config.get<string>('DB_PORT') ?? '3306', 10),
        username: config.get<string>('DB_USERNAME') ?? 'root',
        password: config.get<string>('DB_PASSWORD') ?? '',
        database: config.get<string>('DB_DATABASE') ?? 'openemr_ts',
        autoLoadEntities: true,
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        logging: config.get<string>('NODE_ENV') === 'development' ? ['error'] as const : false,
      }),
    }),

    // Static files
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/',
      exclude: ['/api/(.*)', '/fhir/(.*)', '/oauth2/(.*)'],
    }),

    // Core
    AuditModule,
    AuthModule,
    TenantModule,
    MeteringModule,
    OAuth2Module,
    WebhookModule,

    // Clinical
    PatientModule,
    EncounterModule,
    MedicationModule,
    LabModule,

    // Operations
    SchedulingModule,
    BillingModule,
    DocumentModule,

    // Interoperability
    FhirModule,
    Hl7Module,
    DicomModule,
    PdfModule,
    JobsModule,
    SimulationModule,
    EndpointModule,
    McpModule,
    BillingStripeModule,
  ],
})
export class AppModule {}
