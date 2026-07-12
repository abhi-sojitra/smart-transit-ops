'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Wrench } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/feedback/empty-state';
import { ConfirmationDialog } from '@/components/feedback/confirmation-dialog';
import {
  CloseMaintenanceDialog,
  MaintenanceCard,
  MaintenanceFilters,
  MaintenanceLoadingSkeleton,
  MaintenanceStatisticsCards,
  MaintenanceTable,
} from '@/components/maintenance';
import {
  useCancelMaintenance,
  useCompleteMaintenance,
  useDeleteMaintenance,
  useMaintenanceList,
  useMaintenanceStatistics,
  useStartMaintenance,
} from '@/hooks/use-maintenance';
import type { Maintenance, MaintenanceListParams } from '@/types/maintenance';
import { pageFade, staggerContainer } from '@/components/drivers/motion';

export default function MaintenancePage() {
  const reduceMotion = useReducedMotion();
  const [filters, setFilters] = useState<MaintenanceListParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [completeTarget, setCompleteTarget] = useState<Maintenance | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Maintenance | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Maintenance | null>(null);

  const listQuery = useMaintenanceList(filters);
  const statsQuery = useMaintenanceStatistics();
  const startMutation = useStartMaintenance();
  const completeMutation = useCompleteMaintenance();
  const cancelMutation = useCancelMaintenance();
  const deleteMutation = useDeleteMaintenance();

  const rows = listQuery.data?.data ?? [];
  const meta = listQuery.data?.meta;

  const mobileCards = useMemo(() => rows.slice(0, 20), [rows]);

  if (listQuery.isLoading && statsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Maintenance' }]} />
        <MaintenanceLoadingSkeleton />
      </div>
    );
  }

  if (listQuery.isError) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Maintenance' }]} />
        <EmptyState
          icon={Wrench}
          title="Unable to load maintenance"
          description={
            listQuery.error instanceof Error && listQuery.error.message.includes('401')
              ? 'Sign in required. Use admin@transitops.com / Admin@12345 then reopen Maintenance.'
              : listQuery.error instanceof Error
                ? listQuery.error.message
                : 'Check API connectivity and authentication.'
          }
          actionLabel={
            listQuery.error instanceof Error && listQuery.error.message.includes('401')
              ? 'Go to Sign In'
              : 'Retry'
          }
          onAction={() => {
            if (listQuery.error instanceof Error && listQuery.error.message.includes('401')) {
              window.location.href = '/login';
              return;
            }
            void listQuery.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={pageFade}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      <div>
        <Breadcrumb items={[{ label: 'Home', href: '/dashboard' }, { label: 'Maintenance' }]} />
        <PageHeader
          title="Maintenance"
          description="Preventive and corrective work orders with vehicle status automation."
          actions={
            <Button asChild>
              <Link href="/maintenance/new">
                <Plus className="h-4 w-4" />
                New Maintenance
              </Link>
            </Button>
          }
        />
      </div>

      <MaintenanceStatisticsCards stats={statsQuery.data} loading={statsQuery.isLoading} />

      <MaintenanceFilters
        value={filters}
        onChange={setFilters}
      />

      <div className="hidden md:block">
        <MaintenanceTable
          data={rows}
          meta={meta}
          loading={listQuery.isFetching}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
          onStart={(row) => startMutation.mutate(row.id)}
          onComplete={setCompleteTarget}
          onCancel={setCancelTarget}
          onDelete={setDeleteTarget}
        />
      </div>

      <motion.div
        className="grid gap-3 md:hidden"
        variants={staggerContainer}
        initial={reduceMotion ? false : 'hidden'}
        animate="show"
      >
        {mobileCards.length ? (
          mobileCards.map((item) => (
            <MaintenanceCard
              key={item.id}
              item={item}
              onStart={(row) => startMutation.mutate(row.id)}
              onComplete={setCompleteTarget}
              onCancel={setCancelTarget}
            />
          ))
        ) : (
          <EmptyState title="No maintenance records" description="Create a work order to get started." />
        )}
      </motion.div>

      <CloseMaintenanceDialog
        open={Boolean(completeTarget)}
        onOpenChange={(open) => !open && setCompleteTarget(null)}
        estimatedCost={completeTarget?.estimatedCost}
        loading={completeMutation.isPending}
        onConfirm={(payload) => {
          if (!completeTarget) return;
          completeMutation.mutate(
            { id: completeTarget.id, ...payload },
            { onSuccess: () => setCompleteTarget(null) },
          );
        }}
      />

      <ConfirmationDialog
        open={Boolean(cancelTarget)}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancel maintenance?"
        description="This restores vehicle availability if no other active work remains."
        confirmLabel="Cancel work order"
        variant="danger"
        loading={cancelMutation.isPending}
        onConfirm={() => {
          if (!cancelTarget) return;
          cancelMutation.mutate(
            { id: cancelTarget.id },
            { onSuccess: () => setCancelTarget(null) },
          );
        }}
      />

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete maintenance?"
        description="Soft-deletes the record. Active jobs will restore vehicle status."
        confirmLabel="Delete"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
          });
        }}
      />
    </motion.div>
  );
}
