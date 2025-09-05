import { ApiProperty } from "@nestjs/swagger"
import { IsInt, IsOptional, IsString } from "class-validator"

export class CreateProveedoreDto {
    

    @ApiProperty()
    @IsString()
    nb_proveedor: string

    @ApiProperty()
    @IsString()
    correoProveedor: string

    @ApiProperty()
    @IsString()
    tel_proveedor: string

    @ApiProperty()
    @IsString()
    rfc_proveedor: string

    @ApiProperty()
    @IsString()
    nb_comercial: string

    @ApiProperty()
    @IsString()
    codigoPostal: string

    @ApiProperty()
    @IsInt()
    @IsOptional()
    id_empresa?: number

}
