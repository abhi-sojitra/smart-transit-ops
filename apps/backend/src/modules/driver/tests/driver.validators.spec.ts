import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { IsFutureDate, IsDateAfter } from '../validators/driver.validators';
import { IsDateString } from 'class-validator';

class FutureDateSample {
  @IsDateString()
  @IsFutureDate()
  date!: string;
}

class DateAfterSample {
  @IsDateString()
  start!: string;

  @IsDateString()
  @IsDateAfter('start')
  end!: string;
}

describe('Driver validators', () => {
  it('accepts future dates', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const dto = plainToInstance(FutureDateSample, {
      date: future.toISOString().slice(0, 10),
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects past dates', async () => {
    const past = new Date();
    past.setDate(past.getDate() - 10);
    const dto = plainToInstance(FutureDateSample, {
      date: past.toISOString().slice(0, 10),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
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
