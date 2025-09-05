import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePlanVigenciaDto } from './dto/create-plan-vigencia.dto';
import { UpdatePlanVigenciaDto } from './dto/update-plan-vigencia.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PlanVigencia } from './entities/plan-vigencia.entity';
import { Repository } from 'typeorm';
import { Plane } from 'src/planes/entities/plane.entity';
import { Empresa } from 'src/empresa/entities/empresa.entity';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';

@Injectable()
export class PlanVigenciaService {
  constructor(
    @InjectRepository(PlanVigencia) private readonly planVigenciaRepository: Repository<PlanVigencia>,
    @InjectRepository(Plane) private readonly planeRepository: Repository<Plane>,
    @InjectRepository(Empresa)
    private readonly empresaRepository: Repository<Empresa>,
  ) {}
  async create(createPlanVigenciaDto: CreatePlanVigenciaDto, user: UserActiveInterface) {
     const empresa = await this.empresaRepository.findOne({
      where: {
        id_empresa: user.id_empresa,
      }
    })
    if(!empresa){
      throw new BadRequestException('Empresa no encontrada');
    }
    const plan = await this.planeRepository.findOne({
      where: {
        id_plan: createPlanVigenciaDto.id_plan
      }
    })
    if(!plan){
      throw new BadRequestException('Plan no encontrado');
    }
    const planVigencia = this.planVigenciaRepository.create({...createPlanVigenciaDto, userEmail: user.email, empresa: empresa, plan: plan});
    return this.planVigenciaRepository.save(planVigencia);
  }

  findAll() {
    return this.planVigenciaRepository.find({relations: ['plan']});
  }

  async filtrarEstadoActivo(){
    return this.planVigenciaRepository.find({
      where: {
        estatus: true
      }, relations: ['plan']
    })
  }

  async findOne(id: number) {
    const planVigencia = await this.planVigenciaRepository.findOne({
      where: {
        id_plan_vigencia: id
      }, relations: ['plan']
    })
    if(!planVigencia){
      throw new BadRequestException('Plan vigencia no encontrado');
    }
    return planVigencia
  }

  async update(id: number, updatePlanVigenciaDto: UpdatePlanVigenciaDto, user: UserActiveInterface) {
    const planVigencia = await this.planVigenciaRepository.findOne({
      where: {
        id_plan_vigencia: id, empresa: { id_empresa: user.id_empresa }
      }, relations: ['plan']
    })
    if(!planVigencia){
      throw new BadRequestException('Plan vigencia no encontrado');
    }
    const plan = await this.planeRepository.findOne({
      where: {
        id_plan: updatePlanVigenciaDto.id_plan
      }
    })
    if(!plan){
      throw new BadRequestException('Plan no encontrado');
    }

    Object.assign(planVigencia, updatePlanVigenciaDto);
    planVigencia.plan = plan;
    return this.planVigenciaRepository.save(planVigencia);
  }

  async remove(id: number, user: UserActiveInterface) {
    const planVigencia = await this.planVigenciaRepository.findOne({
      where: {
        id_plan_vigencia: id, empresa: { id_empresa: user.id_empresa }
      }, relations: ['plan']
    })
    if(!planVigencia){
      throw new BadRequestException('Plan vigencia no encontrado');
    }
    return this.planVigenciaRepository.delete(id);
  }
}
