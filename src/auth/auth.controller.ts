import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Patch,
  Param,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guard/auth.guard';
import { Request } from 'express';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guard/roles.guard';
import { Role } from '../common/enums/rol.enum';
import { Auth } from './decorators/auth.decorator';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { UpdateProfileDto } from './dto/UpdateProfileDto';
import { ApiBearerAuth } from '@nestjs/swagger';

//creamos una interfaz para poner el reques del profile y extender el reques
interface RequestWithUser extends Request {
  user: {
    email: string;
    role: string;
  };
}
@ApiBearerAuth('jwt')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register') //registramos un usuario
  register(
    @Body()
    registerDto: RegisterDto,
  ) {
    return this.authService.register(registerDto);
  }
  @Post('login') //generamos el token de acceso del usuario
  login(
    @Body()
    loginDto: LoginDto,
  ) {
    return this.authService.login(loginDto);
  }

  // @Get('profile')// ruta que nos da acceso dependiendo del rol
  // @Roles(Role.ADMIN)//Role viene del enum
  // @UseGuards(AuthGuard, RolesGuard)
  // profile(@Req() req: RequestWithUser) {
  // return this.authService.profile(req.user)
  // }

  @Get('profile') // ruta que nos da acceso dependiendo del rol
  @Auth(Role.EMPRESA) //auth es un decorador que une los guards y los roles
  profile(@ActiveUser() user: UserActiveInterface) {
    return this.authService.profile(user);
  }

  @Auth(Role.SOPORTE)
  @Get('usuarios')
  usuarios(@ActiveUser() user: UserActiveInterface) {
    return this.authService.usuarios(user);
  }

  @Auth(Role.SOPORTE)
  @Get('usuarios-empresa')
  usuariosEmpresa(@ActiveUser() user: UserActiveInterface) {
    return this.authService.usuariosEmpresa(user);
  }

  @Auth(Role.SOPORTE)
  @Get('usuarios-empleado')
  usuariosEmpleado(@ActiveUser() user: UserActiveInterface) {
    return this.authService.usuariosEmpleado(user);
  }

  @Auth([Role.EMPRESA, Role.EMPLEADO])
  @Get('yo')
  me(@ActiveUser() user: UserActiveInterface) {
    return this.authService.me(user);
  }

  // Ruta para que el usuario actualice su propio perfil
  @Patch('profile')
  @Auth([Role.EMPRESA, Role.EMPLEADO]) // Requiere autenticación
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async updateProfile(
    @ActiveUser() user: UserActiveInterface,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return await this.authService.updateProfile(user, updateProfileDto);
  }

  // Ruta para que un admin actualice cualquier usuario
  @Patch('user/:id')
  @Auth([Role.EMPRESA, Role.EMPLEADO]) // Requiere autenticación (el método verificará que sea admin)
  async updateUser(
    @ActiveUser() user: UserActiveInterface,
    @Param('id', ParseIntPipe) userId: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.authService.updateUser(user, userId, updateUserDto);
  }
}
