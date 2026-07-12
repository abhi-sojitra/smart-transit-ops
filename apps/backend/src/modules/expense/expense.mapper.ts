import type { ExpenseRecord } from '@transitops/shared-types';
import type { ExpenseDocument } from '../../schemas/expense.schema';

export function toExpenseDto(doc: ExpenseDocument): ExpenseRecord {
  const timestamps = doc as ExpenseDocument & { createdAt: Date; updatedAt: Date };
  return {
    id: doc._id.toString(),
    vehicleId: doc.vehicleId,
    tripId: doc.tripId,
    driverId: doc.driverId,
    expenseType: doc.expenseType,
    title: doc.title,
    description: doc.description,
    amount: doc.amount,
    expenseDate: doc.expenseDate.toISOString().slice(0, 10),
    receiptImage: doc.receiptImage,
    approvedBy: doc.approvedBy,
    status: doc.status,
    notes: doc.notes,
    createdBy: doc.createdBy?.toString(),
    updatedBy: doc.updatedBy?.toString(),
    createdAt: timestamps.createdAt.toISOString(),
    updatedAt: timestamps.updatedAt.toISOString(),
  };
}

export function toExpenseDtoList(docs: ExpenseDocument[]): ExpenseRecord[] {
  return docs.map(toExpenseDto);
}
