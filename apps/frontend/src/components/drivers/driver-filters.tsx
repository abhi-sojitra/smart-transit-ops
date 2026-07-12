'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { SearchInput } from '@/components/ui/search-input';
import { Input } from '@/components/ui/input';
import { PLACEHOLDERS } from '@/constants/form';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { sectionReveal } from '@/components/drivers/motion';
import { DriverStatus, LicenseCategory, type DriverFiltersState } from '@/types/driver';

interface DriverFiltersProps {
  filters: DriverFiltersState;
  onChange: (next: Partial<DriverFiltersState>) => void;
  onReset: () => void;
}

export function DriverFilters({ filters, onChange, onReset }: DriverFiltersProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="space-y-3 rounded-xl border border-border bg-card/60 p-4"
      variants={sectionReveal}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SearchInput
          containerClassName="md:col-span-2"
          placeholder={PLACEHOLDERS.search}
          value={filters.search}
          debounceMs={300}
          onChange={(value) => onChange({ search: value, page: 1 })}
        />

        <Select
          value={filters.status}
          onValueChange={(value) =>
            onChange({ status: value as DriverFiltersState['status'], page: 1 })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {Object.values(DriverStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {status.replaceAll('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.licenseCategory}
          onValueChange={(value) =>
            onChange({
              licenseCategory: value as DriverFiltersState['licenseCategory'],
              page: 1,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="License category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All categories</SelectItem>
            {Object.values(LicenseCategory).map((category) => (
              <SelectItem key={category} value={category}>
                {category.replaceAll('_', ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Input
          placeholder="Example: Ahmedabad"
          value={filters.city}
          onChange={(e) => onChange({ city: e.target.value, page: 1 })}
        />
        <Input
          placeholder="State"
          value={filters.state}
          onChange={(e) => onChange({ state: e.target.value, page: 1 })}
        />
        <Input
          type="number"
          min={0}
          placeholder="Min experience"
          value={filters.experienceMin}
          onChange={(e) => onChange({ experienceMin: e.target.value, page: 1 })}
        />
        <Input
          type="number"
          min={0}
          placeholder="Max experience"
          value={filters.experienceMax}
          onChange={(e) => onChange({ experienceMax: e.target.value, page: 1 })}
        />
        <div className="flex gap-2">
          <Select
            value={filters.sortBy}
            onValueChange={(value) =>
              onChange({ sortBy: value as DriverFiltersState['sortBy'] })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fullName">Name</SelectItem>
              <SelectItem value="joiningDate">Joining date</SelectItem>
              <SelectItem value="safetyScore">Safety score</SelectItem>
              <SelectItem value="experienceYears">Experience</SelectItem>
              <SelectItem value="createdAt">Created date</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.sortOrder}
            onValueChange={(value) =>
              onChange({ sortOrder: value as 'asc' | 'desc' })
            }
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
