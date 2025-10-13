import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateProveedoreDto } from './dto/create-proveedore.dto';
import { UpdateProveedoreDto } from './dto/update-proveedore.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Proveedore } from './entities/proveedore.entity';
import { Repository } from 'typeorm';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Role } from 'src/common/enums/rol.enum';

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(Proveedore) private readonly proveedoreRepository: Repository<Proveedore>,
    @InjectRepository(Empresa) private readonly empresaRepository: Repository<Empresa>, 
  ){}


  async create(createProveedoreDto: CreateProveedoreDto, user: UserActiveInterface) {
    let empresa: Empresa;
  
    if (user.role === Role.SOPORTE) {
      if (!createProveedoreDto.id_empresa) {
        throw new BadRequestException('El id de la empresa es requerido en el perfil de soporte');
      }
      empresa = await this.empresaRepository.findOne({ where: { id_empresa: createProveedoreDto.id_empresa } });
    } else {
      empresa = await this.empresaRepository.findOne({ where: { id_empresa: user.id_empresa } });
    }
  
    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada');
    }
  
    const existingProveedore = await this.proveedoreRepository.findOne({
      where: { 
        nombre: createProveedoreDto.nombre,
        empresa: {id_empresa: user.role === Role.SOPORTE ? createProveedoreDto.id_empresa : user.id_empresa}
      },
    });
  
    if (existingProveedore) {
      throw new BadRequestException('Ya existe un proveedor con ese nombre para esta empresa');
    }
  
    const existingCorreoProveedor = await this.proveedoreRepository.findOne({
      where: {
        email: createProveedoreDto.email,
        empresa: { id_empresa: user.role === Role.SOPORTE ? createProveedoreDto.id_empresa : user.id_empresa },
      },
    });
  
    if (existingCorreoProveedor) {
      throw new BadRequestException('Ya existe un proveedor con ese correo para esta empresa');
    }
  
    const newProveedore = this.proveedoreRepository.create({
      ...createProveedoreDto,
      userEmail: user.email,
      empresa
    });
  
    return this.proveedoreRepository.save(newProveedore);
  }
  

  async findAll(user: UserActiveInterface) {
    if(user.role === Role.SOPORTE){
      return await this.proveedoreRepository.find({relations: ['empresa']});
    }
    return await this.proveedoreRepository.find({
      where: {
        empresa: { id_empresa: user.id_empresa }
      }, relations: ['empresa']
    });
  }

  async findOne(id: number, user: UserActiveInterface) {

    if(user.role === Role.SOPORTE){
      const proveedore = await this.proveedoreRepository.findOne({
        where: { id_proveedor: id }, relations: ['empresa']
      });
      if(!proveedore){
        throw new BadRequestException('Proveedor no encontrado');
      }
      return proveedore;
    }
    const proveedore = await this.proveedoreRepository.findOne({
      where: { id_proveedor: id, empresa: { id_empresa: user.id_empresa } }, relations: ['empresa']
    })
    if(!proveedore){
      throw new BadRequestException('Proveedor no encontrado');
    }
    return proveedore;
  }


  async update(id: number, updateProveedoreDto: UpdateProveedoreDto, user: UserActiveInterface) {
   let proveedore: Proveedore;
    if(user.role === Role.SOPORTE){
      proveedore = await this.proveedoreRepository.findOne({
        where: { id_proveedor: id }, relations: ['empresa']
      });
      if(!proveedore){
        throw new BadRequestException('Proveedor no encontrado');
      }
    }
    else{
      proveedore = await this.proveedoreRepository.findOne({
        where: { id_proveedor: id, empresa: { id_empresa: user.id_empresa } }, relations: ['empresa']
      })
      if(!proveedore){
        throw new BadRequestException('Proveedor no encontrado');
      }
    }

    const existingProveedore = await this.proveedoreRepository.findOne({
      where: { nombre: updateProveedoreDto.nombre, empresa: { id_empresa: proveedore.empresa.id_empresa } },
    })
    if (existingProveedore && existingProveedore.id_proveedor !== id) {
      throw new BadRequestException('Ya existe un proveedor con ese nombre para esta empresa');
    }

    

    const existingCorreoProveedor = await this.proveedoreRepository.findOne({
      where: {
        email: updateProveedoreDto.email,
        empresa: { id_empresa: proveedore.empresa.id_empresa },
      },
    });
  
    if (existingCorreoProveedor && existingCorreoProveedor.id_proveedor !== id) {
      throw new BadRequestException('Ya existe un proveedor con ese correo para esta empresa');
    }

    const {...provedoresData} = updateProveedoreDto;
    Object.assign(proveedore, provedoresData);
    return this.proveedoreRepository.save(proveedore);
  }

  async remove(id: number, user: UserActiveInterface) {
    if(user.role === Role.SOPORTE){
      const proveedore = await this.proveedoreRepository.findOne({
        where: { id_proveedor: id }, relations: ['empresa']
      });
      if(!proveedore){
        throw new BadRequestException('Proveedor no encontrado');
      }
      return this.proveedoreRepository.delete(id);
    }
   
    const proveedore = await this.proveedoreRepository.findOne({
      where: { id_proveedor: id, empresa: { id_empresa: user.id_empresa } }, relations: ['empresa']
    })
    if(!proveedore){
      throw new BadRequestException('Proveedor no encontrado');
    }
    return this.proveedoreRepository.delete(id);
  }

  //filtrar los proveeedores por empresa para el soporte
  async findProveedoresPorEmpresa(id_empresa: number, user: UserActiveInterface){
    if(user.role !== Role.SOPORTE){
      throw new BadRequestException('Solo los usuarios con perfil SOPORTE pueden acceder a esta información');
    }
    const empresa = await this.empresaRepository.findOne({
      where: {
        id_empresa: id_empresa
      }
    })
    if(!empresa){
      throw new BadRequestException('Empresa no encontrada')
    }
    const proveedor = await this.proveedoreRepository.find({
      where: {
        empresa: {
          id_empresa: id_empresa
        }
      }, relations: ['empresa']
    })
    return proveedor
  }
}
