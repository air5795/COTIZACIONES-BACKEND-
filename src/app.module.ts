import { Module } from '@nestjs/common';
import * as Joi from 'joi';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './core/database/database.module';
import config from './core/config/config';
import { enviroments } from './core/config/enviroments';

import { EmpresaModule } from './modules/empresa/empresa.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmpleadoModule } from './modules/empleado/empleado.module';
import { RegionalModule } from './modules/regional/regional.module';
import { TasaInteresAporteModule } from './modules/tasa-interes-aporte/tasa-interes-aporte.module';
import { SalarioMinimoModule } from './modules/salario-minimo/salario-minimo.module';
import { TipoPlanillaModule } from './modules/tipo-planilla/tipo-planilla.module';
import { PlanillaModule } from './modules/planilla/planilla.module';
import { TipoIncapacidadModule } from './modules/tipo-incapacidad/tipo-incapacidad.module';
import { PlanillaIncapacidadesModule } from './modules/planilla-incapacidades/planilla-incapacidades.module';
import { ResumenMensualRegionalModule } from './modules/resumen-mensual-regional/resumen-mensual-regional.module';
import { UfvModule } from './modules/ufv/ufv.module';
import { TipoCiteModule } from './modules/tipo-cite/tipo-cite.module';
import { ControlCodigosModule } from './modules/control-codigos/control-codigos.module';
import { PlanillaAportesDevengadosModule } from './modules/planilla-aportes-devengados/planilla-aportes-devengados.module';
import { TipoMultasModule } from './modules/tipo-multas/tipo-multas.module';
import { MultasModule } from './modules/multas/multas.module';
import { ParteBajaAseguradoModule } from './modules/parte-baja-asegurado/parte-baja-asegurado.module';
import { ServeStaticModule } from '@nestjs/serve-static';
//import { APP_FILTER } from '@nestjs/core';

import { LoggerModule } from './modules/logger/logger.module';
import { ApiClientModule } from './modules/api-client/api-client.module';
import { PlanillaEmpresaModule } from './modules/planilla-empresa/planilla-empresa.module';
import { UsuarioCotizacionesModule } from './modules/usuario-cotizaciones/usuario-cotizaciones.module';
import { ReportesMensualesModule } from './modules/reportes-mensuales/reportes-mensuales.module';
import { ParClasificadorDetalleModule } from './modules/parametro/par-clasificador-detalle.module';
import { PlanillasAportesModule } from './modules/planillas_aportes/planillas_aportes.module';
import { PlanillasAdicionalesModule } from './modules/planillas_adicionales/planillas_adicionales.module';
import { PagosAportesModule } from './modules/pagos-aportes/pagos-aportes.module';
import { PagosAportesAdicionalesModule } from './modules/pagos-aportes-adicionales/pagos-aportes-adicionales.module';

const db = `postgres://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=disable`;

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: enviroments[db] || '.env',
      load: [config],
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: db,
      }),
    }),

    ServeStaticModule.forRoot({
      rootPath: process.env.ARCHIVOS,
      serveRoot: '/ruta',
      serveStaticOptions: {
        index: false, // Esto desactiva la búsqueda del archivo 'index.html' predeterminado.
      },
    }),
    DatabaseModule,
    AuthModule,
    EmpresaModule,
    EmpleadoModule,
    RegionalModule,
    TasaInteresAporteModule,
    SalarioMinimoModule,
    TipoPlanillaModule,
    PlanillaModule,
    TipoIncapacidadModule,
    PlanillaIncapacidadesModule,
    ResumenMensualRegionalModule,
    UfvModule,
    TipoCiteModule,
    ControlCodigosModule,
    PlanillaAportesDevengadosModule,
    TipoMultasModule,
    MultasModule,
    ParteBajaAseguradoModule,
    LoggerModule,
    ApiClientModule,
    PlanillaEmpresaModule,
    UsuarioCotizacionesModule,
    ReportesMensualesModule,
    ParClasificadorDetalleModule,
    PlanillasAportesModule,
    PlanillasAdicionalesModule,
    PagosAportesModule,
    PagosAportesAdicionalesModule,

  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
