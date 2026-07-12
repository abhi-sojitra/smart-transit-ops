import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vehicle, VehicleDocument } from '../../schemas/vehicle.schema';
import { Driver, DriverDocument } from '../../schemas/driver.schema';
import { Trip, TripDocument } from '../../schemas/trip.schema';

@Injectable()
export class ReferenceValidationService {
  constructor(
    @InjectModel(Vehicle.name) private readonly vehicleModel: Model<VehicleDocument>,
    @InjectModel(Driver.name) private readonly driverModel: Model<DriverDocument>,
    @InjectModel(Trip.name) private readonly tripModel: Model<TripDocument>,
  ) {}

  async validateVehicle(vehicleId: string): Promise<void> {
    const vehicle = await this.vehicleModel.findOne({ vehicleId: vehicleId.toUpperCase() }).exec();
    if (!vehicle) {
      throw new Error(`Vehicle "${vehicleId}" not found`);
    }
  }

  async validateDriver(driverId?: string): Promise<void> {
    if (!driverId) return;
    const normalized = driverId.toUpperCase();
    const driver = await this.driverModel
      .findOne({
        isDeleted: { $ne: true },
        employeeCode: normalized,
      })
      .exec();
    if (!driver) {
      throw new Error(`Driver "${driverId}" not found`);
    }
  }

  async validateTrip(tripId?: string): Promise<void> {
    if (!tripId) return;
    const normalized = tripId.toUpperCase();
    const trip = await this.tripModel
      .findOne({
        isDeleted: { $ne: true },
        tripNumber: normalized,
      })
      .exec();
    if (!trip) {
      throw new Error(`Trip "${tripId}" not found`);
    }
  }

  async validateReferences(refs: {
    vehicleId: string;
    tripId?: string;
    driverId?: string;
  }): Promise<void> {
    await this.validateVehicle(refs.vehicleId);
    await Promise.all([this.validateTrip(refs.tripId), this.validateDriver(refs.driverId)]);
  }
}
