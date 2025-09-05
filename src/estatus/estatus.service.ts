import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateEstatusDto } from './dto/create-estatus.dto';
import { UpdateEstatusDto } from './dto/update-estatus.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Estatus } from './entities/estatus.entity';
import { Repository } from 'typeorm';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Role } from 'src/common/enums/rol.enum';

@Injectable()
export class EstatusService {
  constructor(@InjectRepository(Estatus)
  private estatusRepository: Repository<Estatus>) 
  {}
  async create(createEstatusDto: CreateEstatusDto, user: UserActiveInterface) {
    const estatus = this.estatusRepository.create({...createEstatusDto, userEmail: user.email, empresa: {id_empresa: user.id_empresa}});
    return await this.estatusRepository.save(estatus);
  }

  findAll() {
    return this.estatusRepository.find();
  }

  async findOne(id: number) {
    const estatus = await this.estatusRepository.findOneBy({id_estatus: id});
    if(!estatus){
      throw new BadRequestException("No existe el estatus con ese id");
    }
    return estatus;
  }

  async update(id: number, updateEstatusDto: UpdateEstatusDto) {
   const estatus = await this.estatusRepository.findOneBy({id_estatus: id});
    if(!estatus){
      throw new BadRequestException("No existe el estatus con ese id");
    }
    return await this.estatusRepository.update(id, {
      ...updateEstatusDto,
    })
    
  }

  async remove(id: number, user: UserActiveInterface) {
    if(user.role !== Role.SOPORTE){
      throw new BadRequestException('Solo los usuarios con perfil SOPORTE pueden acceder a esta información');
    }
    const estatus = await this.estatusRepository.findOneBy({id_estatus: id});
    if(!estatus){
      throw new BadRequestException("No existe el estatus con ese id");
    }
    return await this.estatusRepository.remove(estatus);
  }

  //filtro sobre el tipo de estatus
  async findEstatusPorTipo(tp_estatus: string) {
    return await this.estatusRepository.find(
      {
        where: {
          tp_estatus: tp_estatus
        }
      }
    )
  }
}