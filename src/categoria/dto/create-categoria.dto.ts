import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString } from "class-validator";

export class CreateCategoriaDto {

    @ApiProperty()
    @IsString()
    nombre: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    estado?: string;

    @ApiProperty()
    @IsOptional()
    @IsInt()
    id_empresa?: number;
}
