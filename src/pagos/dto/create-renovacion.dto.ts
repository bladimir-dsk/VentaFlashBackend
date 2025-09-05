import { ApiProperty } from "@nestjs/swagger";
import { IsInt } from "class-validator";

export class RenovacionPagoDto {


  @ApiProperty()
    @IsInt()
    id_planVigencia?: number; // Opcional: si no viene, se usa el mismo plan
  }