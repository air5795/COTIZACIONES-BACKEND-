import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanillasAporteDto } from './create-planillas_aporte.dto';

export class UpdatePlanillasAporteDto extends PartialType(CreatePlanillasAporteDto) {}
