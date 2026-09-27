import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { User, UserRole } from '../../users/entities/user.entity';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: User }>();
    const user = request.user;
    if (!user || user.role !== UserRole.SUPERADMIN) {
      throw new ForbiddenException('SuperAdmin access required');
    }
    return true;
  }
}
