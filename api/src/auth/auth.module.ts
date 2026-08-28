import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase.guard';
import { TenantGuard } from './tenant.guard';
import { RolesGuard } from './roles.guard';
import { PermissionsGuard } from './permissions.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailService } from '../common/services/email.service';

import { MfaController } from './mfa.controller';
import { MfaService } from './mfa.service';
import { AalGuard } from './aal.guard';

import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { PrivacyController } from './privacy.controller';

import { AuthorizationService } from './authorization/authorization.service';
import { AuthorizationCacheService } from './authorization/authorization-cache.service';
import { AuthorizationGuard } from './authorization/authorization.guard';

@Module({
  imports: [PrismaModule, WorkspaceModule, NotificationsModule],
  controllers: [AuthController, MfaController, SessionsController, PrivacyController],
  providers: [
    AuthService,
    MfaService,
    SessionsService,
    EmailService,
    AuthorizationService,
    AuthorizationCacheService,
    AuthorizationGuard,
    SupabaseAuthGuard,
    TenantGuard,
    RolesGuard,
    PermissionsGuard,
    AalGuard,
  ],
  exports: [
    AuthService,
    MfaService,
    SessionsService,
    EmailService,
    AuthorizationService,
    AuthorizationCacheService,
    AuthorizationGuard,
    SupabaseAuthGuard,
    TenantGuard,
    RolesGuard,
    PermissionsGuard,
    AalGuard,
  ],
})
export class AuthModule {}

