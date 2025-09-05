import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsString } from "class-validator"

export class CreatePlaneDto {


    @ApiProperty()
    @IsString()
    nb_plan: string

    @ApiProperty()
    @IsString()
    des_plan: string

    @ApiProperty()
    @IsBoolean()
    estatus: boolean

    @ApiProperty()
    @IsArray()
    moduloIds: number[];
}
