// 与后端 Pydantic 契约保持一致（snake_case）。
export interface CarPrice {
  car_id: string;
  brand: string;
  model: string;
  config: string;
  guide_price: number;
  ref_discount_price: number;
  energy_type: 'gas' | 'ev' | 'hybrid';
  fuel_consumption: number;
  power_consumption: number;
  source: string;
  fetched_at: string;
}

export type PlanMode = 'full' | 'loan';
export type Verdict = 'buy' | 'consider' | 'avoid';
export type EnergyType = 'gas' | 'ev' | 'hybrid';

export interface CalcParams {
  price: number;
  mode: PlanMode;
  down_payment_ratio?: number;
  months?: number;
  annual_rate?: number;
  income: number;
  monthly_expense: number;
  savings: number;
  safe_ratio?: number;
  energy_type: EnergyType;
  fuel_consumption: number;
  power_consumption: number;
  monthly_km?: number;
  fuel_price?: number;
  electricity_price?: number;
}

export interface CalcResult {
  mode: PlanMode;
  landed_price: number;
  purchase_tax: number;
  purchase_tax_halved?: boolean;
  insurance: number;
  misc_fee: number;
  down_payment: number;
  loan_amount: number;
  monthly_payment: number;
  total_interest: number;
  disposable_income: number;
  safe_monthly_payment: number;
  energy_type: EnergyType;
  fuel_cost_month: number;
  electricity_cost_month: number;
  energy_cost_month: number;
  monthly_km: number;
  verdict: Verdict;
  verdict_text: string;
  reason: string;
}

export interface CarPriceResult {
  data: CarPrice | null;
  options: CarPrice[];
  is_reference: boolean;
  source: 'cache' | 'live' | 'sample' | 'none';
  note?: string;
}
