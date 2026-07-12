import type { FuelLog } from '@transitops/shared-types';
import type { FuelDocument } from '../../schemas/fuel.schema';

export function toFuelDto(doc: FuelDocument): FuelLog {
  const timestamps = doc as FuelDocument & { createdAt: Date; updatedAt: Date };
  return {
    id: doc._id.toString(),
    vehicleId: doc.vehicleId,
    tripId: doc.tripId,
    driverId: doc.driverId,
    fuelStation: doc.fuelStation,
    fuelType: doc.fuelType,
    quantity: doc.quantity,
    pricePerLiter: doc.pricePerLiter,
    totalCost: doc.totalCost,
    odometerReading: doc.odometerReading,
    filledAt: doc.filledAt.toISOString().slice(0, 10),
    receiptImage: doc.receiptImage,
    notes: doc.notes,
    createdBy: doc.createdBy?.toString(),
    updatedBy: doc.updatedBy?.toString(),
    createdAt: timestamps.createdAt.toISOString(),
    updatedAt: timestamps.updatedAt.toISOString(),
  };
}

export function toFuelDtoList(docs: FuelDocument[]): FuelLog[] {
  return docs.map(toFuelDto);
}
