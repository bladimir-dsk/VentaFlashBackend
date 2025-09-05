import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer"
import { IsNumber, IsOptional, IsString, ValidateNested } from "class-validator"
import { CreateEmpresaDto } from "src/empresa/dto/create-empresa.dto"


class EmpresaDto {

    @ApiProperty()
    @IsString()
    nombre: string;

    @ApiProperty()
    @IsString()
    rfc?: string;

    @ApiProperty()
    @IsNumber()
    id_planVigencia: number;
}

export class CreateUserDto {

    @ApiProperty()
    email: string

    @ApiProperty()
    pwdPassword: string

    @ApiProperty()
    nbNombres?: string

    @ApiProperty()
    nbPrimerApellido?: string

    @ApiProperty()
    nbSegundoApellido?: string
    
    @ApiProperty()
    numTelefonoCelular?: string


    @ApiProperty()
    @IsOptional() // Marca la propiedad como opcional
    @ValidateNested() // Valida el objeto anidado
    @Type(() => EmpresaDto) // Transforma el objeto anidado
    empresa?: EmpresaDto;
}
