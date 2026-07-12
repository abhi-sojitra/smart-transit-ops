'use client';

import Link from 'next/link';
import { Fuel, Receipt, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FuelStatisticsCards, ExpenseStatisticsCards } from '@/components/charts/CostCards';
import { FuelCharts, ExpenseCharts } from '@/components/charts/FuelExpenseCharts';
import { useFuelStatistics, useVehicleFuelComparison } from '@/hooks/use-fuel';
import { useExpenseStatistics } from '@/hooks/use-expenses';

export default function FuelExpensesOverviewPage() {
  const { data: fuelStats, isLoading: fuelLoading } = useFuelStatistics();
  const { data: expenseStats, isLoading: expenseLoading } = useExpenseStatistics();
  const { data: comparison, isLoading: comparisonLoading } = useVehicleFuelComparison();

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Fuel & Expense' }]} />
        <PageHeader
          title="Fuel & Expense Management"
          description="Operational cost overview across fuel logs and fleet expenses."
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Fuel className="h-4 w-4 shrink-0 text-primary" />
              Fuel Management
            </CardTitle>
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <Link href="/fuel">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <FuelStatisticsCards stats={fuelStats} loading={fuelLoading} layout="panel" />
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4 shrink-0 text-primary" />
              Expense Management
            </CardTitle>
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <Link href="/expenses">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <ExpenseStatisticsCards stats={expenseStats} loading={expenseLoading} layout="panel" />
          </CardContent>
        </Card>
      </div>

      <FuelCharts
        stats={fuelStats}
        vehicleComparison={comparison}
        loading={fuelLoading || comparisonLoading}
      />
      <ExpenseCharts stats={expenseStats} loading={expenseLoading} />
    </div>
  );
}
