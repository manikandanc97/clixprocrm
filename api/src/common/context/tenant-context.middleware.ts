import { Injectable, NestMiddleware } from '@nestjs/common';
import { RequestTenantContext } from './tenant-context.interface';
import { TenantContextService } from './tenant-context.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantContext: TenantContextService) {}

  use(req: any, res: any, next: () => void) {
    const initialContext: RequestTenantContext = {
      isSuperAdmin: false,
    };

    this.tenantContext.run(initialContext, () => {
      next();
    });
  }
}
