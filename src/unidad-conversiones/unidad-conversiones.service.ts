import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUnidadConversioneDto } from './dto/create-unidad-conversione.dto';
import { UpdateUnidadConversioneDto } from './dto/update-unidad-conversione.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UnidadConversione } from './entities/unidad-conversione.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UnidadConversionesService {
  constructor(
    @InjectRepository(UnidadConversione) 
    private readonly unidadConversionReposi: Repository<UnidadConversione>,
  ) {}

  async create(createUnidadConversioneDto: CreateUnidadConversioneDto) {
   return "hola"
  }

  findAll() {
    return this.unidadConversionReposi.find({
      relations: ['fromUnit', 'toUnit']
    });
  }

  findOne(id: number) {
    return this.unidadConversionReposi.findOne({
      where: { id_unidadConversion: id },
      relations: ['fromUnit', 'toUnit']
    });
  }

  async update(id: number, updateUnidadConversioneDto: UpdateUnidadConversioneDto) {
    const conversion = await this.unidadConversionReposi.findOne({
      where: { id_unidadConversion: id },
      relations: ['fromUnit', 'toUnit']
    });

    if (!conversion) {
      throw new BadRequestException(`Conversión con ID ${id} no encontrada`);
    }

    // Actualizar los campos de la conversión
    Object.assign(conversion, updateUnidadConversioneDto);

    return this.unidadConversionReposi.save(conversion);
  }

  remove(id: number) {
    return this.unidadConversionReposi.delete(id);
  }

  async findConversion(fromUnit: string, toUnit: string): Promise<UnidadConversione | null> {
    // Buscar conversión directa (de A a B)
    const conversionDirecta = await this.unidadConversionReposi.findOne({
        where: {
            fromUnit: { abreviatura: fromUnit },
            toUnit: { abreviatura: toUnit }
        },
        relations: ['fromUnit', 'toUnit']
    });

    if (conversionDirecta) {
        return conversionDirecta;
    }

    // Buscar conversión inversa (de B a A)
    const conversionInversa = await this.unidadConversionReposi.findOne({
        where: {
            fromUnit: { abreviatura: toUnit },
            toUnit: { abreviatura: fromUnit }
        },
        relations: ['fromUnit', 'toUnit']
    });

    if (conversionInversa) {
        // Crear un nuevo objeto con las propiedades modificadas
        const conversionResultado = new UnidadConversione();
        Object.assign(conversionResultado, conversionInversa);
        
        // Calcular el factor inverso y convertirlo a número
        const factorInverso = 1 / parseFloat(conversionInversa.factor.toString());
        conversionResultado.factor = parseFloat(factorInverso.toFixed(6));
        conversionResultado.fromUnit = conversionInversa.toUnit;
        conversionResultado.toUnit = conversionInversa.fromUnit;
        
        return conversionResultado;
    }

    return null;
}
}