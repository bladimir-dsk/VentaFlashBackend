import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsBoolean, IsInt, IsString } from "class-validator"

export class CreatePlanVigenciaDto {


    @ApiProperty()
    @IsInt()
    duracion: number


    @ApiProperty()
    @IsInt()
    precio: number

    @ApiProperty()
    @IsBoolean()
    @Type(() => Boolean)
    estatus: boolean

    @ApiProperty()
    @IsInt()
    id_plan: number

    @ApiProperty()
    @IsString()
    nb_plan_vigencia: string


    @ApiProperty()
    @IsInt()
    num_mes: number
}
