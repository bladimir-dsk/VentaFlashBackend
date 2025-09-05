import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive } from "class-validator";

export class CreateUnidadConversioneDto {

    @ApiProperty()
    @IsNumber()
    fromUnitId: number;
  

    @ApiProperty()  
    @IsNumber()
    toUnitId: number;
    
    @ApiProperty()
    @IsNumber()
    @IsOptional()
    amount?: number;

    @ApiProperty()
    @IsPositive()
    @IsNumber()
    @IsOptional()
    factor?: number

    
}
