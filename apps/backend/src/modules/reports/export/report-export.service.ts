import { Injectable } from '@nestjs/common';
import type { BiExportFormat, BiReportBase } from '@transitops/shared-types';

@Injectable()
export class ReportExportService {
  export(
    report: BiReportBase,
    format: BiExportFormat,
  ): { filename: string; contentType: string; body: Buffer } {
    const stamp = report.periodEnd.slice(0, 10);
    if (format === 'pdf') {
      return {
        filename: `transitops-${report.type}-${stamp}.pdf`,
        contentType: 'application/pdf',
        body: this.toPdf(report),
      };
    }
    if (format === 'excel') {
      return {
        filename: `transitops-${report.type}-${stamp}.xls`,
        contentType: 'application/vnd.ms-excel',
        body: Buffer.from(this.toExcelXml(report), 'utf8'),
      };
    }
    return {
      filename: `transitops-${report.type}-${stamp}.csv`,
      contentType: 'text/csv; charset=utf-8',
      body: Buffer.from(this.toCsv(report), 'utf8'),
    };
  }

  private toCsv(report: BiReportBase): string {
    const lines = [
      `TransitOps ${report.title}`,
      `Generated,${report.generatedAt}`,
      `Period Start,${report.periodStart}`,
      `Period End,${report.periodEnd}`,
      '',
      'KPI,Value,Unit',
      ...report.kpis.map((k) => `${csv(k.label)},${k.value},${csv(k.unit ?? '')}`),
      '',
      'Insights',
      ...report.insights.map((i) => `${csv(i.severity)},${csv(i.title)},${csv(i.detail)}`),
    ];

    if (report.table?.rows?.length) {
      lines.push('', report.table.columns.map((c) => csv(c.label)).join(','));
      for (const row of report.table.rows) {
        lines.push(report.table.columns.map((c) => csv(String(row[c.key] ?? ''))).join(','));
      }
    }
    return lines.join('\n');
  }

  private toExcelXml(report: BiReportBase): string {
    const rows = [
      [`TransitOps ${report.title}`],
      [`Generated`, report.generatedAt],
      [`Period`, `${report.periodStart} → ${report.periodEnd}`],
      [],
      ['KPI', 'Value', 'Unit'],
      ...report.kpis.map((k) => [k.label, String(k.value), k.unit ?? '']),
      [],
      ['Insight', 'Detail'],
      ...report.insights.map((i) => [i.title, i.detail]),
    ];
    const table = rows
      .map(
        (cols) =>
          `<Row>${cols
            .map((c) => `<Cell><Data ss:Type="String">${escapeXml(String(c))}</Data></Cell>`)
            .join('')}</Row>`,
      )
      .join('');
    return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Report"><Table>${table}</Table></Worksheet></Workbook>`;
  }

  private toPdf(report: BiReportBase): Buffer {
    const lines = [
      `TransitOps ${report.title}`,
      `Period: ${report.periodStart.slice(0, 10)} → ${report.periodEnd.slice(0, 10)}`,
      `Generated: ${report.generatedAt}`,
      '',
      ...report.kpis.map((k) => `${k.label}: ${k.value}${k.unit ? ` ${k.unit}` : ''}`),
      '',
      'Insights:',
      ...report.insights.map((i, idx) => `${idx + 1}. ${i.title} — ${i.detail}`),
    ];
    const content = lines
      .map((line, index) => {
        const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
        const y = 750 - index * 14;
        return `BT /F1 10 Tf 40 ${y} Td (${escaped}) Tj ET`;
      })
      .join('\n');

    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
      `<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}\nendstream`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ];

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [];
    for (let i = 0; i < objects.length; i += 1) {
      offsets.push(Buffer.byteLength(pdf, 'utf8'));
      pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
    }
    const xrefOffset = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (let i = 0; i < offsets.length; i += 1) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(pdf, 'utf8');
  }
}

function csv(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
