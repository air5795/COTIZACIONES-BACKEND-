import { Test, TestingModule } from '@nestjs/testing';
import { UsuarioCotizacionesService } from './usuario-cotizaciones.service';

describe('UsuarioCotizacionesService', () => {
  let service: UsuarioCotizacionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsuarioCotizacionesService],
    }).compile();

    service = module.get<UsuarioCotizacionesService>(UsuarioCotizacionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
