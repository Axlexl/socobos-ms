import type { MonthlyBill, UtilityRates } from '../types';

// ─── Currency ─────────────────────────────────────────────────────────────────

export function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─── Date ─────────────────────────────────────────────────────────────────────

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatMonthLabel(yyyyMM: string): string {
  const [year, month] = yyyyMM.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
}

export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Billing ─────────────────────────────────────────────────────────────────

export function calcBillAmounts(
  rentAmount: number,
  prevElec: number,
  currElec: number,
  prevWater: number,
  currWater: number,
  rates: UtilityRates,
): Pick<
  MonthlyBill,
  'electricityCost' | 'waterCost' | 'totalAmount'
> {
  const electricityCost = (currElec - prevElec) * rates.electricityRate;
  const waterCost = (currWater - prevWater) * rates.waterRate;
  const totalAmount = rentAmount + electricityCost + waterCost;
  return { electricityCost, waterCost, totalAmount };
}
