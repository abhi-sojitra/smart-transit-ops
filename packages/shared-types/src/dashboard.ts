export type DashboardAlertSeverity = 'CRITICAL' | 'WARNING' | 'INFORMATION';

export type DashboardActivityType =
  | 'TRIP'
  | 'MAINTENANCE'
  | 'FUEL'
  | 'EXPENSE'
  | 'DRIVER'
  | 'VEHICLE';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export type ReportFormat = 'csv' | 'pdf';

export interface FleetOverviewStats {
  totalVehicles: number;
  available: number;
  onTrip: number;
  inShop: number;
  retired: number;
  utilizationRate: number;
}

export interface DriverOverviewStats {
  totalDrivers: number;
  available: number;
  onTrip: number;
  suspended: number;
  offDuty: number;
  licenseExpiring: number;
  averageSafetyScore: number;
}

export interface TripOverviewStats {
  active: number;
  completedToday: number;
  cancelled: number;
  total: number;
  revenue: number;
}

export interface MaintenanceOverviewStats {
  active: number;
  overdue: number;
  completed: number;
  cost: number;
}

export interface FuelOverviewStats {
  monthlyCost: number;
  monthlyQuantity: number;
  fuelEfficiency: number;
}

export interface ExpenseOverviewStats {
  monthlyExpense: number;
  pending: number;
  approved: number;
}

export interface FinanceOverviewStats {
  revenue: number;
  profit: number;
  operationalCost: number;
  roi: number;
}

export interface DashboardOverview {
  fleet: FleetOverviewStats;
  drivers: DriverOverviewStats;
  trips: TripOverviewStats;
  maintenance: MaintenanceOverviewStats;
  fuel: FuelOverviewStats;
  expense: ExpenseOverviewStats;
  finance: FinanceOverviewStats;
  generatedAt: string;
}

export interface DashboardActivityItem {
  id: string;
  type: DashboardActivityType;
  title: string;
  description: string;
  status?: string;
  occurredAt: string;
  entityId?: string;
}

export interface DashboardAlert {
  id: string;
  severity: DashboardAlertSeverity;
  category: string;
  title: string;
  message: string;
  entityId?: string;
  entityLabel?: string;
  dueDate?: string;
}

export interface ChartPoint {
  label: string;
  value: number;
  secondary?: number;
}

export interface NamedMetric {
  name: string;
  value: number;
  secondary?: number;
  meta?: Record<string, string | number>;
}

export interface DashboardCharts {
  fleetUtilization: ChartPoint[];
  monthlyRevenue: ChartPoint[];
  monthlyExpense: ChartPoint[];
  fuelConsumption: ChartPoint[];
  maintenanceCost: ChartPoint[];
  tripStatus: ChartPoint[];
  tripTrend: ChartPoint[];
  revenueVsExpense: ChartPoint[];
  driverPerformance: NamedMetric[];
  vehicleRoi: NamedMetric[];
}

export interface TopDriverItem {
  driverId: string;
  name: string;
  employeeCode: string;
  completedTrips: number;
  revenue: number;
  safetyScore: number;
  distance: number;
}

export interface TopVehicleItem {
  vehicleId: string;
  label: string;
  completedTrips: number;
  revenue: number;
  operationalCost: number;
  roi: number;
  utilizationTrips: number;
}

export interface UpcomingMaintenanceItem {
  id: string;
  vehicleId: string;
  vehicleLabel: string;
  serviceType: string;
  status: string;
  date: string;
  cost: number;
}

export interface RecentTripItem {
  id: string;
  tripNumber: string;
  source: string;
  destination: string;
  status: string;
  plannedStartDate: string;
  revenue: number;
  driverName?: string;
  vehicleLabel?: string;
}

export interface BusinessSummary {
  period: ReportPeriod;
  periodStart: string;
  periodEnd: string;
  tripsCompleted: number;
  tripsCancelled: number;
  revenue: number;
  fuelCost: number;
  expenseCost: number;
  maintenanceCost: number;
  operationalCost: number;
  profit: number;
  activeVehicles: number;
  activeDrivers: number;
  utilizationRate: number;
}

export interface DashboardReportPayload {
  summary: BusinessSummary;
  topDrivers: TopDriverItem[];
  topVehicles: TopVehicleItem[];
  generatedAt: string;
}
