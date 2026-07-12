import { Test, TestingModule } from '@nestjs/testing';
import { ReportsController } from '../controller/reports.controller';
import { ReportsService } from '../service/reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: jest.Mocked<ReportsService>;

  beforeEach(async () => {
    service = {
      catalog: jest.fn().mockReturnValue([{ type: 'executive', title: 'Executive' }]),
      getReport: jest.fn().mockResolvedValue({ type: 'executive', kpis: [] }),
      export: jest.fn().mockResolvedValue({
        filename: 'r.csv',
        contentType: 'text/csv',
        body: Buffer.from('a'),
      }),
      schedule: jest.fn().mockResolvedValue({ id: '1', type: 'fleet' }),
      listSchedules: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<ReportsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: service }],
    }).compile();

    controller = module.get(ReportsController);
  });

  it('returns catalog', () => {
    expect(controller.catalog()).toEqual([{ type: 'executive', title: 'Executive' }]);
  });

  it('delegates executive report', async () => {
    await controller.getExecutive({});
    expect(service.getReport).toHaveBeenCalledWith('executive', {}, undefined);
  });

  it('exports report file', async () => {
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
    await controller.export(
      { type: 'fleet', format: 'csv' },
      undefined,
      res as never,
    );
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
    expect(res.send).toHaveBeenCalled();
  });
});
