import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUnidadMedidaDto } from './dto/create-unidad-medida.dto';
import { UpdateUnidadMedidaDto } from './dto/update-unidad-medida.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UnidadMedida } from './entities/unidad-medida.entity';
import { Repository } from 'typeorm';
import { UnidadConversione } from 'src/unidad-conversiones/entities/unidad-conversione.entity';
import { CreateUnidadConversioneDto } from '../unidad-conversiones/dto/create-unidad-conversione.dto';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Role } from 'src/common/enums/rol.enum';
import { TipoUnidadMedida } from 'src/common/enums/TipoUnidadMedida';

@Injectable()
export class UnidadMedidaService {
  constructor(
    @InjectRepository(UnidadMedida)
    private readonly unidadMedidaRepository: Repository<UnidadMedida>,
    @InjectRepository(UnidadConversione)
    private conversionRepository: Repository<UnidadConversione>,
  ) {}
  async create(createUnidadMedidaDto: CreateUnidadMedidaDto, user: UserActiveInterface) {
    const existe = await this.unidadMedidaRepository.findOne({
      where: {
        nb_unidadMedida: createUnidadMedidaDto.nb_unidadMedida
      }
    })
    if(existe){
      throw new BadRequestException('Ya existe una unidad de medida con ese nombre');
    }
   const unidad = this.unidadMedidaRepository.create({...createUnidadMedidaDto, userEmail: user.email});
    return this.unidadMedidaRepository.save(unidad);
  }

  async createConversion(createUnidadConversioneDto: CreateUnidadConversioneDto): Promise<UnidadConversione> {
    const { fromUnitId, toUnitId, factor } = createUnidadConversioneDto;

    const fromUnit = await this.unidadMedidaRepository.findOne({
      where: { id_unidadMedida: fromUnitId },
    });
    const toUnit = await this.unidadMedidaRepository.findOne({
      where: { id_unidadMedida: toUnitId },
    });

    if (!fromUnit || !toUnit) {
      throw new BadRequestException('Una de las unidades no existe');
    }

    // Validar que el factor sea un número
    const numericFactor = parseFloat(factor.toString());
    if (isNaN(numericFactor)) {
      throw new BadRequestException('El factor de conversión debe ser un número válido');
    }

    const conversion = this.conversionRepository.create({
      fromUnit,
      toUnit,
      factor: numericFactor,
    });

    return await this.conversionRepository.save(conversion);
  }

  async convertValue(createUnidadConversioneDto: CreateUnidadConversioneDto): Promise<{ 
    fromUnitId: number; 
    toUnitId: number; 
    amount: number; 
    result: number 
  }> {
    const { fromUnitId, toUnitId, amount } = createUnidadConversioneDto;

    // Validar que amount sea un número
    const numericAmount = parseFloat(amount.toString());
    if (isNaN(numericAmount)) {
      throw new BadRequestException('La cantidad a convertir debe ser un número válido');
    }

    const conversion = await this.conversionRepository.findOne({
      where: { 
        fromUnit: { id_unidadMedida: fromUnitId }, 
        toUnit: { id_unidadMedida: toUnitId } 
      },
    });

    if (!conversion) {
      throw new BadRequestException('No existe una conversión entre estas unidades');
    }

    // Asegurarse de que el factor es numérico
    const numericFactor = parseFloat(conversion.factor.toString());
    if (isNaN(numericFactor)) {
      throw new BadRequestException('El factor de conversión almacenado no es válido');
    }

    return {
      fromUnitId,
      toUnitId,
      amount: numericAmount,
      result: numericAmount * numericFactor,
    };
  }

  async findAll(user: UserActiveInterface, tipo?: TipoUnidadMedida) {
    if (tipo) {
      // Validar si el tipo existe en el enum
      const esTipoValido = Object.values(TipoUnidadMedida).includes(tipo);
      if (!esTipoValido) {
        throw new BadRequestException(`El tipo '${tipo}' no es válido. Tipos permitidos: ${Object.values(TipoUnidadMedida).join(', ')}`);
      }
  
      // Buscar en la base de datos
      const unidades = await this.unidadMedidaRepository.find({
        where: { tipoUnidadMedida: tipo, estado: true },
      });
  
      if (unidades.length === 0) {
        throw new BadRequestException(`No existen unidades de medida registradas con el tipo '${tipo}'`);
      }
  
      return unidades;
    }
  
    return this.unidadMedidaRepository.find(
      { where: { estado: true } },
    );
  }
  
  async findOne(id: number) {
    const unidadmedida = await this.unidadMedidaRepository.findOneBy({ id_unidadMedida: id });
    if (!unidadmedida) {
      throw new BadRequestException('No existe la unidad de medida con ese id');
    }
    return unidadmedida;
  }

  async update(id: number, updateUnidadMedidaDto: UpdateUnidadMedidaDto, user: UserActiveInterface) {
    const unidadmedida = await this.unidadMedidaRepository.findOneBy({ id_unidadMedida: id });
    if (!unidadmedida) {
      throw new BadRequestException('No existe la unidad de medida con ese id');
    }
    return this.unidadMedidaRepository.update({ id_unidadMedida: id }, { ...updateUnidadMedidaDto, userEmail: user.email });
  }

  async remove(id: number, user: UserActiveInterface) {
    const unidadmedida =  await this.unidadMedidaRepository.findOneBy({ id_unidadMedida: id });
    if (!unidadmedida) {
      throw new BadRequestException('No existe la unidad de medida con ese id');
    }
    return this.unidadMedidaRepository.delete(id);
  }

  async findTipoUnidadPorUnidad(user: UserActiveInterface, id_unidadMedida: number) {
    try {
      // Paso 1: Buscar la unidad de medida por ID para obtener su tipo
      const unidadBase = await this.unidadMedidaRepository.findOne({
        where: { id_unidadMedida: id_unidadMedida },
        select: ['tipoUnidadMedida'] // Solo necesitamos el tipo
      });
  
      // Verificar si la unidad existe
      if (!unidadBase) {
        throw new BadRequestException(`Unidad de medida con ID ${id_unidadMedida} no encontrada`);
      }
  
      // Paso 2: Buscar todas las unidades que tienen el mismo tipo
      const unidadesMismoTipo = await this.unidadMedidaRepository.find({
        where: { 
          tipoUnidadMedida: unidadBase.tipoUnidadMedida 
        },
        order: { nb_unidadMedida: 'ASC' } // Ordenar por nombre
      });
  
      return {
        tipo: unidadBase.tipoUnidadMedida,
        unidades: unidadesMismoTipo,
        total: unidadesMismoTipo.length
      };
  
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al buscar unidades por tipo');
    }
  }



}
