import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from 'src/common/enums/rol.enum';

export class UpdateUserDto extends PartialType(CreateUserDto) {

    @IsOptional()
    @IsEmail({}, { message: 'El email debe tener un formato válido' })
    @IsNotEmpty({ message: 'El email no puede estar vacío' })
    email?: string;
  
    @IsOptional()
    @IsString({ message: 'La contraseña debe ser una cadena de texto' })
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
    pwdPassword?: string;
  
    @IsOptional()
    @IsString()
    nbNombres?: string;
  
    @IsOptional()
    @IsString()
    nbPrimerApellido?: string;
  
    @IsOptional()
    @IsString()
    nbSegundoApellido?: string;
  
    @IsOptional()
    @IsString()
    numTelefonoCelular?: string;
  
    @IsOptional()
    role?: Role;
}
