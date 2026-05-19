// ─── Utility Rates ───────────────────────────────────────────────────────────

export interface UtilityRates {
  electricityRate: number; // ₱ per kWh
  waterRate: number;       // ₱ per unit
}

// ─── Room ────────────────────────────────────────────────────────────────────

export type RoomStatus = 'occupied' | 'vacant';

export interface Room {
  id: string;
  number: string;           // e.g. "101"
  monthlyRent: number;      // base rent e.g. 3500
  status: RoomStatus;
  currentTenancyId: string | null; // points to active Tenancy record
}

// ─── Tenancy ─────────────────────────────────────────────────────────────────
// One record per tenant stay. A room can have many tenancies over time.

export type TenancyStatus = 'active' | 'moved_out';

export interface Tenancy {
  id: string;
  roomId: string;
  roomNumber: string;

  // Tenant info
  tenantName: string;
  tenantPhone: string;

  // Move-in / move-out
  moveInDate: string;       // ISO date
  moveOutDate: string | null;
  status: TenancyStatus;

  // Initial payments (collected once on move-in)
  securityDeposit: number;  // default 3500
  advancePayment: number;   // default 3500
  initialPaymentsPaid: boolean;
}

// ─── Monthly Bill ─────────────────────────────────────────────────────────────
// One bill per tenancy per month. Tied to tenancyId — never to roomId alone.

export type BillStatus = 'unpaid' | 'partial' | 'paid';

export interface MonthlyBill {
  id: string;
  tenancyId: string;
  roomId: string;
  roomNumber: string;
  month: string;            // "2026-05" (YYYY-MM)

  // Meter readings
  prevElectricity: number;
  currElectricity: number;
  prevWater: number;
  currWater: number;

  // Rates used at time of generation (snapshot — rate changes don't affect old bills)
  electricityRate: number;
  waterRate: number;

  // Computed costs
  rentAmount: number;
  electricityCost: number;
  waterCost: number;
  totalAmount: number;

  // Payment tracking
  amountPaid: number;
  balance: number;
  status: BillStatus;

  dueDate: string;          // ISO date
  generatedAt: string;      // ISO date
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export interface Payment {
  id: string;
  billId: string;
  tenancyId: string;
  roomNumber: string;
  tenantName: string;
  amount: number;
  date: string;             // ISO date
  note?: string;
}
