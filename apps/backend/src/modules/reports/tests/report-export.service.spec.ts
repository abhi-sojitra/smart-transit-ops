import { ReportExportService } from '../export/report-export.service';
import type { BiReportBase } from '@transitops/shared-types';

describe('ReportExportService', () => {
  const service = new ReportExportService();
  const report: BiReportBase = {
    type: 'executive',
    title: 'Executive Summary',
    generatedAt: '2026-07-12T00:00:00.000Z',
    periodStart: '2026-06-01T00:00:00.000Z',
    periodEnd: '2026-07-01T00:00:00.000Z',
    kpis: [{ key: 'profit', label: 'Profit', value: 100, unit: 'USD' }],
    charts: {},
    leaderboards: {},
    insights: [{ id: '1', severity: 'info', title: 'Stable', detail: 'OK' }],
  };

  it('exports csv', () => {
    const file = service.export(report, 'csv');
    expect(file.filename).toContain('.csv');
    expect(file.body.toString('utf8')).toContain('Profit');
  });

  it('exports pdf', () => {
    const file = service.export(report, 'pdf');
    expect(file.contentType).toBe('application/pdf');
    expect(file.body.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('exports excel xml', () => {
    const file = service.export(report, 'excel');
    expect(file.filename).toContain('.xls');
    expect(file.body.toString('utf8')).toContain('Workbook');
  });
});
