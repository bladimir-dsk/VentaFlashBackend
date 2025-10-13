import { ApiProperty } from "@nestjs/swagger"
import { IsInt, IsOptional, IsString } from "class-validator"

export class CreateProveedoreDto {
    

    @ApiProperty()
    @IsString()
    nombre: string

    @ApiProperty()
    @IsString()
    email: string

    @ApiProperty()
    @IsOptional()
    @IsString()
    telefono: string;

    @ApiProperty()
    @IsString()
    empresa_proveedor: string;

    @ApiProperty()
    @IsInt()
    @IsOptional()
    id_empresa?: number

}
