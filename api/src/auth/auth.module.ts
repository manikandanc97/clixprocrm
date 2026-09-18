import { Module, forwardRef } from '@nestjs/common';
import { EmailService } from '../common/services/email.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { WorkspaceModule } from '../workspace/workspace.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PermissionsGuard } from './permissions.guard';
import { RolesGuard } from './roles.guard';
import { SupabaseAuthGuard } from './supabase.guard';
import { TenantGuard } from './tenant.guard';

import { AalGuard } from './aal.guard';
import { MfaController } from './mfa.controller';
import { MfaService } from './mfa.service';

import { PrivacyController } from './privacy.controller';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

import { AuthorizationCacheService } from './authorization/authorization-cache.service';
import { AuthorizationGuard } from './authorization/authorization.guard';
import { AuthorizationService } from './authorization/authorization.service';

@Module({
  imports: [
    PrismaModule,
    WorkspaceModule,
    NotificationsModule,
    forwardRef(() => QueueModule),
  ],
  controllers: [
    AuthController,
    MfaController,
    SessionsController,
    PrivacyController,
  ],
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
