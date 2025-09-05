import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator"
import { TipoUnidadMedida } from "src/common/enums/TipoUnidadMedida"

export class CreateUnidadMedidaDto {


    @ApiProperty()
    @IsString()
    nb_unidadMedida: string


    @ApiProperty()
    @IsString()
    abreviatura: string

    @ApiProperty()
    @IsEnum(TipoUnidadMedida)
    tipoUnidadMedida: TipoUnidadMedida

    @ApiProperty()
     @IsBoolean()
    @IsOptional()
    @Type(() => Boolean)
    estado?: boolean;
}
