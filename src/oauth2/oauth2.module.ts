import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OAuth2Client } from './entities/oauth2-client.entity.js';
import { OAuth2Token } from './entities/oauth2-token.entity.js';
import { OAuth2Service } from './oauth2.service.js';
import { OAuth2Controller } from './oauth2.controller.js';
import { OAuth2OrJwtGuard } from './guards/oauth2-or-jwt.guard.js';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([OAuth2Client, OAuth2Token]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') ?? 'dev-secret',
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [OAuth2Controller],
  providers: [OAuth2Service, OAuth2OrJwtGuard],
  exports: [OAuth2Service, OAuth2OrJwtGuard],
})
export class OAuth2Module {}
