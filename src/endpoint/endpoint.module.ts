import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Endpoint } from './entities/endpoint.entity.js';
import { EndpointService } from './endpoint.service.js';
import { EndpointController } from './endpoint.controller.js';
import { TenantModule } from '../tenant/tenant.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Endpoint]),
    TenantModule,
  ],
  controllers: [EndpointController],
  providers: [EndpointService],
  exports: [EndpointService],
})
export class EndpointModule {}
