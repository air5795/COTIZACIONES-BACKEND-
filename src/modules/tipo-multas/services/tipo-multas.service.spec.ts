import { Test, TestingModule } from '@nestjs/testing';
import { TipoMultasService } from './tipo-multas.service';

describe('TipoMultasService', () => {
  let service: TipoMultasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TipoMultasService],
    }).compile();

    service = module.get<TipoMultasService>(TipoMultasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
