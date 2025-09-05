import { IsBoolean, IsDate, IsInt } from "class-validator"
import { Type } from 'class-transformer';
import { ApiProperty } from "@nestjs/swagger";

export class CreatePagoDto {


    @ApiProperty()
    @IsInt()
    monto?: number

    // @Type(() => Date)
    // @IsDate({ message: 'Debe ser una fecha válida' })
    // fecha_pago: Date


    @ApiProperty()
    @IsBoolean()
    @Type(() => Boolean)
    estado?: boolean

    @ApiProperty()
    @IsInt()
    id_planVigencia?: number

    // @IsInt()
    // id_empresa: number
}
