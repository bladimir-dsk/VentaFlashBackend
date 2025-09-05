import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNumber, IsOptional, IsString } from "class-validator";

export class CreatePerfilDto {


    @ApiProperty()
    @IsString()
    nb_perfil: string;


    @ApiProperty()
    @IsArray()
    moduloIds: number[];

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    id_empresa?: number; // Opcional para el rol SOPORTE
}
