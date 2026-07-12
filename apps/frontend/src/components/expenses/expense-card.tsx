'use client';

import Link from 'next/link';
import { Eye, Pencil, Receipt, Trash2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import type { ExpenseRecord } from '@transitops/shared-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExpenseStatusBadge } from '@/components/expenses/expense-status-badge';
import { staggerItem } from '@/components/drivers/motion';
import { cn } from '@/utils/cn';
import { formatDisplayDate } from '@/utils/date';
import { costBarPercent, formatExpenseAmount, getExpenseInitials } from '@/components/fuel/fuel-display';

interface ExpenseCardProps {
  expense: ExpenseRecord;
  onDelete?: (expense: ExpenseRecord) => void;
}

export function ExpenseCard({ expense, onDelete }: ExpenseCardProps) {
  const reduceMotion = useReducedMotion();
  const barWidth = `${costBarPercent(expense.amount)}%`;
  const amountTone =
    expense.status === 'REJECTED'
      ? 'text-red-500'
      : expense.status === 'PENDING'
        ? 'text-amber-500'
        : 'text-emerald-500';

  return (
    <motion.div
      variants={staggerItem}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
    >
      <Card className="overflow-hidden border-border/80 transition-colors hover:border-primary/30">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary ring-1 ring-primary/20">
              {getExpenseInitials(expense.title)}
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base">{expense.title}</CardTitle>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">{expense.vehicleId}</p>
            </div>
          </div>
          <ExpenseStatusBadge status={expense.status} />
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Receipt className="h-3.5 w-3.5 shrink-0" />
            <span>{expense.expenseType.replaceAll('_', ' ')}</span>
          </div>

          <p className="text-xs text-muted-foreground">{formatDisplayDate(expense.expenseDate)}</p>

          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Amount</span>
              <span className={cn('font-semibold tabular-nums', amountTone)}>
                {formatExpenseAmount(expense.amount)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  expense.status === 'REJECTED'
                    ? 'bg-red-500'
                    : expense.status === 'PENDING'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500',
                )}
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: barWidth }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/expenses/${expense.id}`}>
                <Eye className="h-3.5 w-3.5" />
                View
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link href={`/expenses/${expense.id}/edit`}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Link>
            </Button>
            {onDelete ? (
              <Button variant="ghost" size="sm" onClick={() => onDelete(expense)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
