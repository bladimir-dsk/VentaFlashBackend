import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty()
  @IsOptional()
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  email?: string;

  @ApiProperty()
  @IsOptional()
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  pwdPassword?: string;


  @ApiProperty()
  @IsOptional()
  @IsString()
  nbNombres?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  nbPrimerApellido?: string;


  @ApiProperty()
  @IsOptional()
  @IsString()
  nbSegundoApellido?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  numTelefonoCelular?: string;
}
