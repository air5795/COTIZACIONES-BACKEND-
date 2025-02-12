export interface IPlanilla {
  createdAt: Date;
  updatedAt: Date;
  activo: boolean;
  userId: number;
  idUsuarioMod: number;
  idPlanilla: number;
  idTipoPlanilla: number;
  diasTrabajados: number;
  cargo: string;
  fechaIngreso: Date;
  fechaRetiro: Date | null;
  totalGanado: string;
  totalDescuento: string;
  fecha: Date;
  observaciones: string;
  aprobado: string;
  fechaAprobacion: Date | null;
  aprobadoPor: string | null;
  gestion: number;
  periodo: number;
  idTasa: number;
  idEmpleado: number;
  idSalarioMinimo: number;
}
