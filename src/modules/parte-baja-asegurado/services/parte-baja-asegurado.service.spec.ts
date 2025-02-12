import { Test, TestingModule } from '@nestjs/testing';
import { ParteBajaAseguradoService } from './parte-baja-asegurado.service';

describe('ParteBajaAseguradoService', () => {
  let service: ParteBajaAseguradoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParteBajaAseguradoService],
    }).compile();

    service = module.get<ParteBajaAseguradoService>(ParteBajaAseguradoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
