import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateModuloDto {

    @ApiProperty()
    @IsString()
    nombre: string;

    @ApiProperty()
    @IsString()
    icono: string;
}
