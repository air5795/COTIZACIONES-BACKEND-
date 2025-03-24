import { PartialType } from '@nestjs/mapped-types';
import { CreatePagosAportesAdicionaleDto } from './create-pagos-aportes-adicionale.dto';

export class UpdatePagosAportesAdicionaleDto extends PartialType(CreatePagosAportesAdicionaleDto) {}
