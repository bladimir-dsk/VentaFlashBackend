import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePlaneDto } from './dto/create-plane.dto';
import { UpdatePlaneDto } from './dto/update-plane.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Plane } from './entities/plane.entity';
import { Repository } from 'typeorm';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { User } from '../users/entities/user.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { Modulo } from 'src/modulos/entities/modulo.entity';
import { PlanVigencia } from 'src/plan-vigencia/entities/plan-vigencia.entity';

@Injectable()
export class PlanesService {
  constructor(
    @InjectRepository(Plane) private readonly planeRepository: Repository<Plane>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
    @InjectRepository(Modulo)
    private readonly moduloRepository: Repository<Modulo>,
    @InjectRepository(PlanVigencia)
    private readonly  planVigenciaRepository: Repository<PlanVigencia>,
  ) {}
  async create(createPlaneDto: CreatePlaneDto, user: UserActiveInterface) {
    const empresa = await this.empresaRepository.findOne({
      where: {
        id_empresa: user.id_empresa,
      }
    })
    if(!empresa){
      throw new BadRequestException('Empresa no encontrada');
    }
    const modulo = await this.moduloRepository.findByIds(createPlaneDto.moduloIds);
    if (modulo.length !== createPlaneDto.moduloIds.length) {
      throw new BadRequestException('El modulo no existe');
    }
    const plan = this.planeRepository.create({...createPlaneDto, userEmail: user.email, empresa: empresa, modulo: modulo});
    return this.planeRepository.save(plan);
  }

  async findAll() {
    return this.planeRepository.find({relations: ['modulo', 'planVigencia']});
  }

  async findAllActive() {
    return this.planeRepository.find({where: { estatus: true}, relations: ['modulo', 'planVigencia']});
  }

  async findOne(id: number) {
    const plan = await this.planeRepository.findOne({
      where: {
        id_plan: id
      }, relations: ['modulo', 'planVigencia']
    })
    if(!plan){
      throw new BadRequestException('Plan no encontrado');
    }
    return plan
  }

  async update(id: number, updatePlaneDto: UpdatePlaneDto, user: UserActiveInterface) {
    const plan = await this.planeRepository.findOne({
      where: {
        id_plan: id, empresa: { id_empresa: user.id_empresa }
      }, relations: ['modulo', 'planVigencia']
    })
    if(!plan){
      throw new BadRequestException('Plan no encontrado');
    }
    const modulo = await this.moduloRepository.findByIds(updatePlaneDto.moduloIds);
    if(modulo.length !== updatePlaneDto.moduloIds.length){
      throw new BadRequestException('Modulo no encontrado');
    }
    Object.assign(plan, updatePlaneDto);
    plan.modulo = modulo;
    return this.planeRepository.save(plan);
  }

  async remove(id: number, user: UserActiveInterface) {
    const plan = await this.planeRepository.findOne({
      where: {
        id_plan: id, empresa: { id_empresa: user.id_empresa }
      }, relations: ['modulo', 'planVigencia']
    })
    if(!plan){
      throw new BadRequestException('Plan no encontrado');
    }
    return this.planeRepository.delete(id);
  }
}
