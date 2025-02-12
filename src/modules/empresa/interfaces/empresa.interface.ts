export interface IEmpresaExterno {
  EMP_COD: number;
  EMP_REG: string;
  EMP_NPATRONAL: string;
  EMP_NOM: string;
  EMP_LEGAL: string;
  EMP_ACTIV: string;
  EMP_NTRAB: number;
  EMP_CALLE: string;
  EMP_NUM: string;
  EMP_TELF: string;
  EMP_ZONA: string;
  EMP_LOCALIDAD: string;
  EMP_FINI_ACT: string | null;
  EMP_LUG: string;
  EMP_FEC: string;
  EMP_USU: string;
  EMP_ESTADO: string;
  EMP_FEC_BAJA: string | null;
  EMP_OBS: string;
  TIPO: string;
  EMP_NOM_CORTO: string;
  EMP_NIT: number;
  EMP_MATRICULA: string | null;
  FECHA_REGISTRO: string | null;
  FECHA_MODIFICACION: string | null;
  USUARIO_REGISTRO: string | null;
  USUARIO_MODIFICACION: string | null;
  EMP_COD_ENTIDAD: string;
}

export interface IEmpresa {
  createdAt: Date;
  updatedAt: Date;
  activo: boolean;
  userId: number;
  idUsuarioMod: number;
  idEmpresa: number;
  empNpatronal: string;
  empCod?: string | null; // nullable
  empReg?: string | null; // nullable
  empNom?: string | null; // nullable
  subEmpNom?: string | null; // nullable
  empLegal?: string | null; // nullable
  empActiv?: string | null; // nullable
  empNtrab?: number | null; // numeric se considera number en TypeScript
  empCalle?: string | null; // nullable
  empNum?: string | null; // nullable
  empTelf?: string | null; // nullable
  empZona?: string | null; // nullable
  empLocalidad?: string | null; // nullable
  empFiniAct?: Date | null; // nullable
  empLug?: string | null; // nullable
  empFech?: Date | null; // nullable
  empEstado?: string | null; // nullable
  empFecBaja?: string | null; // nullable
  empObs?: string | null; // nullable
  tipo?: string | null; // nullable
  empNomCorto?: string | null; // nullable
  empNit?: string | null; // nullable
  empMatricula?: string | null; // nullable
  vigente?: boolean | null; // nullable
  idRegional?: number | null; // nullable, foreign key
}
