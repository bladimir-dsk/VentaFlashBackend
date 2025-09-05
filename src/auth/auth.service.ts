import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';

import * as bcryptjs from 'bcryptjs';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { EmpresaService } from 'src/empresa/empresa.service';
import { PagosService } from 'src/pagos/pagos.service';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly empresaService: EmpresaService,
    private readonly pagosService: PagosService,
  ) {}

  //en el register resivimos el registerDto que se comporta como RegisterDto
  async register(registerDto: RegisterDto) {
    const { nbNombres, email, pwdPassword, empresa } = registerDto;

    // Verificar si el usuario ya existe
    const userExists = await this.usersService.findOneByEmail(email);
    if (userExists) {
      throw new BadRequestException('El email ya está registrado');
    }

    // Hashear la contraseña
    const hashedPassword = await bcryptjs.hash(pwdPassword, 10);

    // Crear el usuario sin empresa (por ahora)
    const userData = {
      nbNombres,
      email,
      pwdPassword: hashedPassword,
      empresa: null, // La empresa se asignará después de crear el pago
    };

    const newUser = await this.usersService.create(userData);

    // Crear la empresa y generar el método de pago
    let pagoResult;
    if (empresa) {
      pagoResult = await this.empresaService.create(empresa, newUser.id); // Pasamos el ID del usuario
    }

    // Asociar la empresa al usuario
    if (pagoResult && pagoResult.empresa) {
      await this.usersService.update(newUser.id, {
        empresa: pagoResult.empresa, // Asignar la empresa al usuario
      });
    }

    return {
      message: 'Registro exitoso. Realiza el pago para activar la empresa.',
      pagoUrl: pagoResult ? pagoResult.url : null,
    };
  }
  async login({ email, pwdPassword }: LoginDto) {
    const user = await this.usersService.finByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException(
        'El correo no existe en la base de datos',
      );
    }

    const isPasswordValid = await bcryptjs.compare(
      pwdPassword,
      user.pwdPassword,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('La contraseña no es correcta');
    }

    const payload = {
      email: user.email,
      role: user.role,
      nombre: user.nbNombres,
      id_empresa: user.empresa ? user.empresa.id_empresa : null, // Asegúrate de que aquí no sea undefined
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      email,
      id_empresa: user.empresa ? user.empresa.id_empresa : null,
      role: user.role,
      id: user.id,
      nombre: user.nbNombres
    };
  }

  async profile({ email, role }: { email: string; role: string }) {
    //VALIDAMOS QUE EL USUARIO CUMPLA CON EL ROL DE ADMIN PARA DEJARLO INGRESAR
    //if(role !== 'admin'){
    //    throw new UnauthorizedException('NO ESTAS AUTORIZADO PARA INGRESAR, DEBES DE SER ADMIN')
    // }

    return await this.usersService.findOneByEmail(email);
  }
  async usuarios(user: UserActiveInterface) {
    const users = await this.usersService.findAll();
    return users;
  }

  async usuariosEmpresa(user: UserActiveInterface) {
    const users = await this.usersService.findUsuariosEmpresa();
    return users;
  }

  async usuariosEmpleado(user: UserActiveInterface) {
    const users = await this.usersService.findUsuariosEmpleado();
    return users;
  }

  async me(user: UserActiveInterface) {
    const me = await this.usersService.miUsuario(user);
    return me;
  }

  // Agrega estos métodos a tu AuthService

  // Método para actualizar el perfil del usuario autenticado
  async updateProfile(user: UserActiveInterface, updateUserDto: UpdateUserDto) {
    
    try {
      const updatedUser = await this.usersService.updateProfile(
        user,
        updateUserDto,
      );


      return {
        message: 'Perfil actualizado exitosamente',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          nbNombres: updatedUser.nbNombres,
          role: updatedUser.role,
          empresa: updatedUser.empresa,
        },
      };
    } catch (error) {
      console.error('Error en updateProfile:', error); // Debug log
      if (
        error instanceof BadRequestException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new HttpException(
        'Error al actualizar el perfil',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Método para que un admin pueda actualizar cualquier usuario
  async updateUser(
    adminUser: UserActiveInterface,
    userId: number,
    updateUserDto: UpdateUserDto,
  ) {
    console.log(
      'AuthService - updateUser llamado por admin:',
      adminUser.email,
      'para usuario:',
      userId,
    ); // Debug log

    // Verificar que el usuario que hace la petición sea admin
    if (adminUser.role !== 'admin') {
      throw new UnauthorizedException(
        'No tienes permisos para realizar esta acción',
      );
    }

    try {
      const updatedUser = await this.usersService.update(userId, updateUserDto);

      console.log(
        'Usuario actualizado exitosamente por admin:',
        updatedUser.email,
      ); // Debug log

      return {
        message: 'Usuario actualizado exitosamente',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          nbNombres: updatedUser.nbNombres,
          role: updatedUser.role,
          empresa: updatedUser.empresa,
        },
      };
    } catch (error) {
      console.error('Error en updateUser:', error); // Debug log
      if (
        error instanceof BadRequestException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new HttpException(
        'Error al actualizar el usuario',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
