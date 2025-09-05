import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateModuloDto } from './dto/create-modulo.dto';
import { UpdateModuloDto } from './dto/update-modulo.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Modulo } from './entities/modulo.entity';
import { Repository } from 'typeorm';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { Role } from 'src/common/enums/rol.enum';

@Injectable()
export class ModulosService {

  constructor(
    @InjectRepository(Modulo) private readonly moduloRepository: Repository<Modulo>
  ) {}
  create(createModuloDto: CreateModuloDto, user: UserActiveInterface) {
    const modulo = this.moduloRepository.create({...createModuloDto, userEmail: user.email});
    return this.moduloRepository.save(modulo);
  }

  async findAll(user: UserActiveInterface) {
   if(user.role === Role.SOPORTE){
     return await this.moduloRepository.find();
   }
   return await this.moduloRepository.find();
  }

  async findOne(id: number, user: UserActiveInterface) {
    const modulo = await this.moduloRepository.findOneBy(
      { id_modulo: id, userEmail: user.email}
    )
    if (!modulo) {
      throw new BadRequestException('El modulo no existe');
    }
    return modulo;
  }

  async update(id: number, updateModuloDto: UpdateModuloDto, user: UserActiveInterface) {
    const modulo = await this.moduloRepository.findOneBy(
      { id_modulo: id, userEmail: user.email}
    )
    if (!modulo) {
      throw new BadRequestException('El modulo no existe');
    }
    return this.moduloRepository.update(id, updateModuloDto);
  }

  async remove(id: number, user: UserActiveInterface) {
    const modulo = await this.moduloRepository.findOneBy(
      { id_modulo: id, userEmail: user.email}
    )
    if (!modulo) {
      throw new BadRequestException('El modulo no existe');
    }
    return this.moduloRepository.delete(id);
  }
}
