import { ApiProperty } from '@nestjs/swagger';
import {
    IsBoolean,
    IsEmail,
    IsInt,
    IsOptional,
    IsString,
    ValidateIf,
  } from 'class-validator';
  
  export class CreateEmpleadoDto {

    @ApiProperty()
    @IsString()
    nombre: string;
  
    @ApiProperty()
    @IsOptional()
    @IsInt()
    id_empresa?: number;
  
    @ApiProperty()
    @IsInt()
    id_perfil: number;
  
    @ApiProperty()
    @IsInt()
    id_estatus: number;
  
    @ApiProperty()
    @IsBoolean()
    aplicaEnUsuario: boolean;
  

    @ApiProperty()
    @ValidateIf(o => o.aplicaEnUsuario === true)
    @IsString()
    nbNombres?: string;
  

    @ApiProperty()
    @ValidateIf(o => o.aplicaEnUsuario === true)
    @IsEmail()
    email?: string;
  

    @ApiProperty()
    @IsOptional()
    @IsEmail()
    emailPersonal?: string;
  

    @ApiProperty()
    @ValidateIf(o => o.aplicaEnUsuario === true)
    @IsString()
    pwdPassword?: string;
  }
  