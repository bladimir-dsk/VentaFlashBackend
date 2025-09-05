import { PartialType } from '@nestjs/mapped-types';
import { CreateUnidadConversioneDto } from './create-unidad-conversione.dto';

export class UpdateUnidadConversioneDto extends PartialType(CreateUnidadConversioneDto) {}
