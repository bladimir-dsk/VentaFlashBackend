import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { CreatePagoDto } from 'src/pagos/dto/create-pago.dto';

export class CreateEmpresaDto {

  @ApiProperty()
  @IsString()
  nombre: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  path_foto?: string;


  @ApiProperty()
  @IsInt()
  monto?: number;

  // @Type(() => Date)
  // @IsDate({ message: 'Debe ser una fecha válida' })
  // fecha_pago: Date


  @ApiProperty()
  @IsBoolean()
  @Type(() => Boolean)
  estado?: boolean;
  
  
  @ApiProperty()
  @IsInt()
  id_planVigencia?: number;

  @ApiProperty()
  @IsString()
  @MaxLength(13, {message: 'El RFC no puede tener más de 13 caracteres'})
  @MinLength(12, {message: 'El RFC no puede tener menos de 12 caracteres'})
  // @IsOptional()
  rfc?: string;

 
}
