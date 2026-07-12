import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { IsDateString } from 'class-validator';
import {
  IsFutureDate,
  IsDateAfter,
  IsPastOrToday,
} from '../validators/fleet.validators';

class FutureDateSample {
  @IsDateString()
  @IsFutureDate()
  date!: string;
}

class PastOrTodaySample {
  @IsDateString()
  @IsPastOrToday()
  date!: string;
}

class DateAfterSample {
  @IsDateString()
  start!: string;

  @IsDateString()
  @IsDateAfter('start')
  end!: string;
}

describe('Fleet validators', () => {
  it('accepts future dates and rejects today', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const today = new Date();

    const ok = plainToInstance(FutureDateSample, {
      date: future.toISOString().slice(0, 10),
    });
    expect(await validate(ok)).toHaveLength(0);

    const todayDto = plainToInstance(FutureDateSample, {
      date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
    });
    expect((await validate(todayDto)).length).toBeGreaterThan(0);
  });

  it('rejects past dates for future validator', async () => {
    const past = new Date();
    past.setDate(past.getDate() - 10);
    const dto = plainToInstance(FutureDateSample, {
      date: past.toISOString().slice(0, 10),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts past or today for last service', async () => {
    const past = new Date();
    past.setDate(past.getDate() - 3);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const pastDto = plainToInstance(PastOrTodaySample, {
      date: past.toISOString().slice(0, 10),
    });
    expect(await validate(pastDto)).toHaveLength(0);

    const todayDto = plainToInstance(PastOrTodaySample, { date: todayStr });
    expect(await validate(todayDto)).toHaveLength(0);

    const future = new Date();
    future.setDate(future.getDate() + 2);
    const futureDto = plainToInstance(PastOrTodaySample, {
      date: future.toISOString().slice(0, 10),
    });
    expect((await validate(futureDto)).length).toBeGreaterThan(0);
  });

  it('validates date-after relationships', async () => {
    const dto = plainToInstance(DateAfterSample, {
      start: '2026-01-01',
      end: '2025-01-01',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
