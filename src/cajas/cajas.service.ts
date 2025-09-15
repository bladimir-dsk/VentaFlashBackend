import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCajaDto } from './dto/create-caja.dto';
import { UpdateCajaDto } from './dto/update-caja.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Caja } from './entities/caja.entity';
import { Repository } from 'typeorm';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Empleado } from 'src/empleado/entities/empleado.entity';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Role } from 'src/common/enums/rol.enum';

@Injectable()
export class CajasService {
  constructor(
    @InjectRepository(Caja) private readonly cajaRepository: Repository<Caja>,
    @InjectRepository(Empresa) private readonly empresaRepository:Repository<Empresa>,
     
  ){}
  async create(createCajaDto: CreateCajaDto, user: UserActiveInterface) {
     let empresa: Empresa;
        if(user.role === Role.SOPORTE){
          if(!createCajaDto.id_empresa){
            throw new BadRequestException('El id de la empresa es requerido en el perfil de soporte');
          }
          empresa = await this.empresaRepository.findOne({ where: { id_empresa: createCajaDto.id_empresa } });
        }
        else{
          empresa = await this.empresaRepository.findOne({ where: { id_empresa: user.id_empresa } });
        }
       
        if (!empresa) {
            throw new BadRequestException('Empresa no encontrada');
        }
    
        ///validar si ya existe una caja con ese numero
        const existingCaja = await this.cajaRepository.findOne({
          where: {
            num_caja: createCajaDto.num_caja,
            empresa: {id_empresa: empresa.id_empresa}
          }
        })

        if (existingCaja) {
          throw new BadRequestException('Ya existe una caja con ese numero');
        }

      const newCaja = this.cajaRepository.create({
        ...createCajaDto,
        empresa,
        userEmail: user.email
      })

      return this.cajaRepository.save(newCaja);
      
  }

  async findAll(user: UserActiveInterface) {
    if(user.role === Role.SOPORTE){
      return this.cajaRepository.find({
        relations: ['empresa'],
      });
    }
  
    return await this.cajaRepository.find()
  }

  async findOne(id: number, user: UserActiveInterface) {
    if(user.role === Role.SOPORTE){
      const caja = await this.cajaRepository.findOne({
        where: {
          id_caja: id
        }, relations: ['empresa']
      })
      if(!caja ){
        throw new BadRequestException('Caja no encontrada')
      }
      return caja
    }
    const caja = await this.cajaRepository.findOne({
      where: {
        id_caja:id, 
        empresa: {id_empresa: user.id_empresa}
      }
    })
    if(!caja ){
      throw new BadRequestException('Caja no encontrada')
    }
    return caja
  }

  async update(id: number, updateCajaDto: UpdateCajaDto, user: UserActiveInterface) {
    let caja : Caja
    if(user.role === Role.SOPORTE){
      caja = await this.cajaRepository.findOne({
        where: {
          id_caja: id
        }, relations: ['empresa']
      })
    }else {
      caja = await this.cajaRepository.findOne({
        where: {
          id_caja: id,
          empresa: {id_empresa: user.id_empresa}
        }
      })
    }
    if(!caja ){
      throw new BadRequestException('Caja no encontrada')
    }
   
    Object.assign(caja, updateCajaDto)
    // caja.empleado = empleado
    return await this.cajaRepository.save(caja)

  }

  async remove(id: number, user: UserActiveInterface) {
    if(user.role === Role.SOPORTE){
      const caja = await this.cajaRepository.findOne({
        where: {
          id_caja:id
        }, relations: ['empresa']
      })
      if(!caja){
        throw new BadRequestException('Caja no encontrada')
      }
      if(caja.empleado){
        throw new BadRequestException('No se puede eliminar una caja con empleado')
      }
      return await this.cajaRepository.delete(id)
    }
    const caja = await this.cajaRepository.findOne({
      where: {
        id_caja:id,
        empresa: {id_empresa: user.id_empresa}
      }
    })
    if(!caja){
      throw new BadRequestException('Caja no encontrada')
    }
    if(caja.empleado){
      throw new BadRequestException('No se puede eliminar una caja con empleado')
    }
    return await this.cajaRepository.remove(caja)
  }
}
