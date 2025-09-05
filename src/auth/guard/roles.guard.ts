import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../../common/enums/rol.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get the allowed roles from the metadata
    const allowedRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are specified, allow access
    if (!allowedRoles) {
      return true;
    }

    // Get the user from the request
    const { user } = context.switchToHttp().getRequest();

    // Allow access if the user is SOPORTE
    if (user.role === Role.SOPORTE) {
      return true;
    }

    // Check if the user's role is included in the allowed roles
    return allowedRoles.includes(user.role);
  }
}