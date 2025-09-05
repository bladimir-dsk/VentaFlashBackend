import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsDateString, IsEmail, IsInt, IsNumber, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from "class-validator";
import { CreateEmpresaDto } from "src/empresa/dto/create-empresa.dto";


// class EmpresaDto {
//     @IsString()
//     nombre: string;

//     @IsNumber()
//     id_planVigencia: number;
// }

// class PagoDto {
//     @IsNumber()
//     monto: number;

//     @IsBoolean()
//     @Type(() => Boolean)
//     estado: boolean;

//      @IsInt()
//     id_planVigencia: number
// }

export class RegisterDto{

    @ApiProperty()
    @Transform(({value}) => value.trim())
    @IsString()
    @MinLength(1)
    nbNombres:string;
    

    @ApiProperty()
    @IsEmail()
    email:string;


    @ApiProperty()
    //transform nos sirve para validar que no envien espacios en blanco
    @Transform(({value}) => value.trim()) //el value.trim limpia los caracteres en blanco
    @IsString()
    @MinLength(6)
    pwdPassword:string;


    

    @ApiProperty()
    @IsOptional() // Marca la propiedad como opcional
     @ValidateNested() // Valida el objeto anidado
     @Type(() => CreateEmpresaDto) // Transforma el objeto anidado
     empresa?: CreateEmpresaDto;

    // @IsOptional() // Marca la propiedad como opcional
    //  @ValidateNested() // Valida el objeto anidado
    //  @Type(() => PagoDto) // Transforma el objeto anidado
    //  pago?: PagoDto;
}