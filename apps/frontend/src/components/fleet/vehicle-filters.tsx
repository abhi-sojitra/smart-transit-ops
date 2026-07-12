'use client';

import { Search } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { sectionReveal } from '@/components/fleet/motion';
import { VehicleStatus, VehicleType, FuelType, type VehicleFiltersState } from '@/types/fleet';

interface VehicleFiltersProps {
  filters: VehicleFiltersState;
  onChange: (next: Partial<VehicleFiltersState>) => void;
  onReset: () => void;
}

export function VehicleFilters({ filters, onChange, onReset }: VehicleFiltersProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="space-y-3 rounded-xl border border-border bg-card/60 p-4"
      variants={sectionReveal}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search vehicle ID, registration, make, model..."
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value, page: 1 })}
          />
        </div>

        <Select
          value={filters.status}
          onValueChange={(value) =>
            onChange({ status: value as VehicleFiltersState['status'], page: 1 })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {Object.values(VehicleStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status.replaceAll('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.vehicleType}
          onValueChange={(value) =>
            onChange({ vehicleType: value as VehicleFiltersState['vehicleType'], page: 1 })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Vehicle type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All types</SelectItem>
            {Object.values(VehicleType).map((type) => (
              <SelectItem key={type} value={type}>
                {type.replaceAll('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Select
          value={filters.fuelType}
          onValueChange={(value) =>
            onChange({ fuelType: value as VehicleFiltersState['fuelType'], page: 1 })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Fuel type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All fuel types</SelectItem>
            {Object.values(FuelType).map((fuel) => (
              <SelectItem key={fuel} value={fuel}>
                {fuel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Depot city"
          value={filters.depotCity}
          onChange={(e) => onChange({ depotCity: e.target.value, page: 1 })}
        />
        <Input
          placeholder="Depot state"
          value={filters.depotState}
          onChange={(e) => onChange({ depotState: e.target.value, page: 1 })}
        />
        <Input
          type="number"
          min={1980}
          placeholder="Min year"
          value={filters.yearMin}
          onChange={(e) => onChange({ yearMin: e.target.value, page: 1 })}
        />
        <Input
          type="number"
          min={0}
          placeholder="Min mileage"
          value={filters.mileageMin}
          onChange={(e) => onChange({ mileageMin: e.target.value, page: 1 })}
        />
        <div className="flex gap-2">
          <Select
            value={filters.sortBy}
            onValueChange={(value) =>
              onChange({ sortBy: value as VehicleFiltersState['sortBy'] })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vehicleId">Vehicle ID</SelectItem>
              <SelectItem value="make">Make</SelectItem>
              <SelectItem value="model">Model</SelectItem>
              <SelectItem value="mileage">Mileage</SelectItem>
              <SelectItem value="year">Year</SelectItem>
              <SelectItem value="createdAt">Created date</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.sortOrder}
            onValueChange={(value) => onChange({ sortOrder: value as 'asc' | 'desc' })}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Asc</SelectItem>
              <SelectItem value="desc">Desc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onReset}>
          Reset filters
        </Button>
      </div>
    </motion.div>
  );
}
