import { Test, TestingModule } from '@nestjs/testing';
import { TipoIncapacidadService } from './tipo-incapacidad.service';

describe('TipoIncapacidadService', () => {
  let service: TipoIncapacidadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TipoIncapacidadService],
    }).compile();

    service = module.get<TipoIncapacidadService>(TipoIncapacidadService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
