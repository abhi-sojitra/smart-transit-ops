import type {
  BiExportFormat,
  BiReportFilters,
  BiReportType,
  BiScheduleFrequency,
  BiReportBase,
  BiReportCatalogItem,
  BiScheduledReport,
  BiExecutiveReport,
} from '@transitops/shared-types';

export type {
  BiExportFormat,
  BiReportFilters,
  BiReportType,
  BiScheduleFrequency,
  BiReportBase,
  BiReportCatalogItem,
  BiScheduledReport,
  BiExecutiveReport,
};

export const REPORT_NAV: Array<{ type: BiReportType; title: string; href: string }> = [
  { type: 'executive', title: 'Executive', href: '/reports/executive' },
  { type: 'fleet', title: 'Fleet', href: '/reports/fleet' },
  { type: 'drivers', title: 'Drivers', href: '/reports/drivers' },
  { type: 'vehicles', title: 'Vehicles', href: '/reports/vehicles' },
  { type: 'trips', title: 'Trips', href: '/reports/trips' },
  { type: 'maintenance', title: 'Maintenance', href: '/reports/maintenance' },
  { type: 'fuel', title: 'Fuel', href: '/reports/fuel' },
  { type: 'expenses', title: 'Expenses', href: '/reports/expenses' },
  { type: 'financial', title: 'Financial', href: '/reports/financial' },
  { type: 'profitability', title: 'Profitability', href: '/reports/profitability' },
];
