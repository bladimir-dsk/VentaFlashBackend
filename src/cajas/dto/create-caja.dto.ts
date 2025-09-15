import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNumber, IsOptional } from "class-validator";

export class CreateCajaDto {

    @ApiProperty()
    @IsNumber()
    num_caja: number;


    @ApiProperty()
    @IsNumber()
    monto: number;


    // @ApiProperty()
    // @IsInt()
    // id_empleado: number


    @ApiProperty()
    @IsInt()
    @IsOptional()
    id_empresa?: number
}
