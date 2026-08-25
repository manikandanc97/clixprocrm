import { SetMetadata, applyDecorators } from '@nestjs/common';
import { DataScope } from './authorization-types';

export const PERMISSION_REQUIREMENT_KEY = 'auth:permission_requirement';
export const REQUIRE_OWNER_KEY = 'auth:require_owner';

export interface PermissionRequirementMetadata {
  permission: string;
  scope?: DataScope;
}

/**
 * Requires a specific permission and optional required scope.
 * Example: @RequirePermission('crm:leads:view', 'ORGANIZATION')
 */
export const RequirePermission = (permission: string, scope?: DataScope) =>
  SetMetadata(PERMISSION_REQUIREMENT_KEY, { permission, scope });

/**
 * Decorator to restrict an endpoint strictly to the active Organization Owner or Platform Super Admin.
 */
export const RequireOwner = () => SetMetadata(REQUIRE_OWNER_KEY, true);
