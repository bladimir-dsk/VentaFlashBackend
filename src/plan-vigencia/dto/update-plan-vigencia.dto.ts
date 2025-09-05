import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanVigenciaDto } from './create-plan-vigencia.dto';

export class UpdatePlanVigenciaDto extends PartialType(CreatePlanVigenciaDto) {}
