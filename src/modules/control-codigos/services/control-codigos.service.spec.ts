import { Test, TestingModule } from '@nestjs/testing';
import { ControlCodigosService } from './control-codigos.service';

describe('ControlCodigosService', () => {
  let service: ControlCodigosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ControlCodigosService],
    }).compile();

    service = module.get<ControlCodigosService>(ControlCodigosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
