import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateEstatusDto {
    
    @ApiProperty()
    @IsString()
    nb_estatus: string;


    @ApiProperty()
    @IsString()
    tp_estatus: string;


    @ApiProperty()
    @IsString()
    cv_estatus: string;
}