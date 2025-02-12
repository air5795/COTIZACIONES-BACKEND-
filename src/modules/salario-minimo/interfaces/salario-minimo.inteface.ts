export interface ISalarioMinimo {
  idSalarioMinimo?: number; // El signo de interrogación indica que es opcional
  gestion: string;
  monto: number;
  vigente: boolean;
  observaciones?: string; // Opcional debido a "nullable: true"
  //planilla?: Planilla;   // Suponiendo que también tengas una interfaz para PlanillaEntity
}
