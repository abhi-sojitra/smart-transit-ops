'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Pencil,
  PlayCircle,
  Truck,
  Wrench,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { MaintenanceStatus } from '@transitops/shared-types';
import { PageHeader } from '@/components/layout/page-header';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/feedback/empty-state';
import { ConfirmationDialog } from '@/components/feedback/confirmation-dialog';
import {
  CloseMaintenanceDialog,
  MaintenanceDetailSkeleton,
  MaintenanceStatusBadge,
  MaintenanceTimeline,
} from '@/components/maintenance';
import {
  useCancelMaintenance,
  useCompleteMaintenance,
  useMaintenanceDetail,
  useStartMaintenance,
  useUploadMaintenanceAttachments,
} from '@/hooks/use-maintenance';
import { pageFade } from '@/components/drivers/motion';

function money(value?: number) {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export default function MaintenanceDetailPage() {
  const reduceMotion = useReducedMotion();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const detailQuery = useMaintenanceDetail(id);
  const completeMutation = useCompleteMaintenance();
  const cancelMutation = useCancelMaintenance();
  const startMutation = useStartMaintenance();
  const uploadMutation = useUploadMaintenanceAttachments(id);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (detailQuery.isLoading) return <MaintenanceDetailSkeleton />;

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <EmptyState
        title="Maintenance not found"
        description="The work order may have been deleted."
        actionLabel="Back to list"
        onAction={() => router.push('/maintenance')}
      />
    );
  }

  const item = detailQuery.data;
  const active =
    item.status === MaintenanceStatus.SCHEDULED || item.status === MaintenanceStatus.IN_PROGRESS;

  return (
    <motion.div
      className="space-y-6"
      variants={pageFade}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      <div>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/dashboard' },
            { label: 'Maintenance', href: '/maintenance' },
            { label: item.maintenanceNumber },
          ]}
        />
        <PageHeader
          title={item.maintenanceNumber}
          description={item.title}
          actions={
            <div className="flex flex-wrap gap-2">
              <MaintenanceStatusBadge status={item.status} />
              {item.status !== MaintenanceStatus.CANCELLED ? (
                <Button variant="outline" asChild>
                  <Link href={`/maintenance/${item.id}/edit`}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Link>
                </Button>
              ) : null}
              {item.status === MaintenanceStatus.SCHEDULED ? (
                <Button
                  loading={startMutation.isPending}
                  onClick={() => startMutation.mutate(item.id)}
                >
                  <PlayCircle className="h-4 w-4" /> Start work
                </Button>
              ) : null}
              {active ? (
                <>
                  <Button onClick={() => setCompleteOpen(true)}>
                    <CheckCircle2 className="h-4 w-4" /> Complete
                  </Button>
                  <Button variant="outline" onClick={() => setCancelOpen(true)}>
                    <XCircle className="h-4 w-4" /> Cancel
                  </Button>
                </>
              ) : null}
            </div>
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryChip
          icon={Truck}
          label="Vehicle"
          value={`${item.vehicleNumber ?? '—'}${item.vehicleModel ? ` · ${item.vehicleModel}` : ''}`}
        />
        <SummaryChip
          icon={Wrench}
          label="Type"
          value={item.maintenanceType?.replaceAll('_', ' ') ?? '—'}
        />
        <SummaryChip icon={Calendar} label="Expected" value={formatDate(item.expectedCompletionDate)} />
        <SummaryChip icon={DollarSign} label="Est. Cost" value={money(item.estimatedCost)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
              <Detail icon={Truck} label="Vehicle" value={`${item.vehicleNumber ?? '—'} · ${item.vehicleModel ?? ''}`} />
              <Detail icon={Wrench} label="Type" value={item.maintenanceType?.replaceAll('_', ' ') ?? '—'} />
              <Detail label="Priority" value={item.priority} />
              <Detail label="Vendor" value={item.vendorName ?? '—'} />
              <Detail label="Service center" value={item.serviceCenter ?? '—'} />
              <Detail label="Odometer" value={item.odometerReading?.toLocaleString() ?? '—'} />
              <Detail icon={Calendar} label="Start" value={formatDate(item.startDate)} />
              <Detail icon={Calendar} label="Expected" value={formatDate(item.expectedCompletionDate)} />
              <Detail icon={Calendar} label="Completed" value={formatDate(item.completedDate)} />
              <Detail icon={Calendar} label="Next service" value={formatDate(item.nextServiceDue)} />
              <Detail icon={DollarSign} label="Estimated cost" value={money(item.estimatedCost)} />
              <Detail icon={DollarSign} label="Actual cost" value={money(item.actualCost)} />
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Description</p>
                <p className="mt-1">{item.description || '—'}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-muted-foreground">Notes</p>
                <p className="mt-1 whitespace-pre-wrap">{item.notes || '—'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attachments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.attachments?.length ? (
                <ul className="space-y-2 text-sm">
                  {item.attachments.map((file) => (
                    <li key={file.filename} className="flex items-center justify-between gap-2">
                      <span>{file.originalName}</span>
                      <a
                        className="text-primary hover:underline"
                        href={`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, '') ?? 'http://localhost:4000'}${file.url}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No files uploaded yet.</p>
              )}
              {active || item.status === MaintenanceStatus.COMPLETED ? (
                <div className="space-y-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,image/jpeg,image/png,image/gif,image/webp,application/pdf"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
                      const allowedExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];
                      const invalid = files.filter((file) => {
                        const name = file.name.toLowerCase();
                        return !(
                          allowed.includes(file.type) ||
                          allowedExt.some((ext) => name.endsWith(ext))
                        );
                      });
                      if (invalid.length) {
                        toast.error('Only image and PDF files are allowed');
                        e.target.value = '';
                        return;
                      }
                      if (files.length) uploadMutation.mutate(files);
                      e.target.value = '';
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Images and PDF only.</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <MaintenanceTimeline
              events={
                item.timeline ?? [
                  {
                    status: MaintenanceStatus.SCHEDULED,
                    label: 'Maintenance Created',
                    timestamp: item.createdAt,
                    completed: true,
                  },
                  {
                    status: MaintenanceStatus.IN_PROGRESS,
                    label: 'In Progress',
                    timestamp:
                      item.status === MaintenanceStatus.IN_PROGRESS ||
                      item.status === MaintenanceStatus.COMPLETED
                        ? item.updatedAt
                        : undefined,
                    completed:
                      item.status === MaintenanceStatus.IN_PROGRESS ||
                      item.status === MaintenanceStatus.COMPLETED,
                  },
                  {
                    status: MaintenanceStatus.COMPLETED,
                    label: 'Completed',
                    timestamp: item.completedDate,
                    completed: item.status === MaintenanceStatus.COMPLETED,
                  },
                ]
              }
            />
          </CardContent>
        </Card>
      </div>

      <CloseMaintenanceDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        estimatedCost={item.estimatedCost}
        loading={completeMutation.isPending}
        onConfirm={(payload) => {
          completeMutation.mutate(
            { id: item.id, ...payload },
            { onSuccess: () => setCompleteOpen(false) },
          );
        }}
      />

      <ConfirmationDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel maintenance?"
        description="Vehicle availability will be restored if no other active maintenance exists."
        confirmLabel="Cancel work order"
        variant="danger"
        loading={cancelMutation.isPending}
        onConfirm={() => {
          cancelMutation.mutate(
            { id: item.id },
            { onSuccess: () => setCancelOpen(false) },
          );
        }}
      />
    </motion.div>
  );
}

function SummaryChip({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <Card className="border-border/80">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Detail({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
}) {
  return (
    <div>
      <p className="inline-flex items-center gap-1.5 text-muted-foreground">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
