import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanillasAdicionaleDto } from './create-planillas_adicionale.dto';

export class UpdatePlanillasAdicionaleDto extends PartialType(CreatePlanillasAdicionaleDto) {}
