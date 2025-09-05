import { UseGuards, applyDecorators } from "@nestjs/common";
import { Role } from "../../common/enums/rol.enum";
import { RolesGuard } from "../guard/roles.guard";
import { AuthGuard } from "../guard/auth.guard";
import { Roles } from './roles.decorator';

export function Auth(roles: Role | Role[]) {
  return applyDecorators(
    Roles(Array.isArray(roles) ? roles : [roles]), // Pass an array of roles
    UseGuards(AuthGuard, RolesGuard)
  );
}