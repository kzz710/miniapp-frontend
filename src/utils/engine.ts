// 计算 / 决策引擎（纯函数），与后端 app/engine 逻辑保持一致。
// 用途：后端不可用时前端离线兜底，保证 MVP 全流程可跑通。
import type { CalcParams, CalcResult, EnergyType, PlanMode, Verdict } from '@/types/car';

export const TAX_DIVISOR = 11.3;
export const INSURANCE_RATE = 0.05;
export const MISC_FEE = 0.15;
export const SAFE_RATIO = 0.3;

export function calcLandedPrice(price: number) {
  const purchaseTax = price / TAX_DIVISOR;
  const insurance = price * INSURANCE_RATE;
  const miscFee = MISC_FEE;
  return { purchaseTax, insurance, miscFee, landedPrice: price + purchaseTax + insurance + miscFee };
}

export function calcLoan(price: number, downPaymentRatio: number, months: number, annualRate: number) {
  const loanAmount = price * (1 - downPaymentRatio);
  const downPayment = price * downPaymentRatio;
  const r = annualRate / 12;
  let monthlyPayment: number;
  if (r === 0) monthlyPayment = loanAmount / months;
  else {
    const pow = Math.pow(1 + r, months);
    monthlyPayment = (loanAmount * r * pow) / (pow - 1);
  }
  const totalInterest = monthlyPayment * months - loanAmount;
  return { loanAmount, downPayment, monthlyPayment, totalInterest };
}

export function calcFullPlan(price: number) {
  const land = calcLandedPrice(price);
  return { ...land, mode: 'full' as PlanMode, downPayment: land.landedPrice, loanAmount: 0, monthlyPayment: 0, totalInterest: 0 };
}

export function calcLoanPlan(price: number, downPaymentRatio: number, months: number, annualRate: number) {
  const land = calcLandedPrice(price);
  const loan = calcLoan(price, downPaymentRatio, months, annualRate);
  return { ...land, mode: 'loan' as PlanMode, ...loan };
}

export function evaluate(
  mode: PlanMode,
  monthlyPayment: number,
  disposableIncome: number,
  savings: number,
  landedPrice: number,
  monthlyExpense: number,
  safeRatio = SAFE_RATIO,
) {
  const safe = disposableIncome * safeRatio;
  if (mode === 'full') {
    const buffer = savings - landedPrice;
    const monthsBuffer = monthlyExpense > 0 ? buffer / monthlyExpense : Infinity;
    if (buffer >= monthlyExpense * 3) {
      return { verdict: 'buy' as Verdict, verdictText: '买买买', reason: `全款后仍有约 ${monthsBuffer.toFixed(1)} 个月支出缓冲，买买买！`, safeMonthlyPayment: safe, disposableIncome, ratio: null };
    }
    return { verdict: 'avoid' as Verdict, verdictText: '买个 der', reason: `全款后储蓄见底（仅剩约 ${monthsBuffer.toFixed(1)} 个月缓冲），风险高，先攒钱吧（买个 der）。`, safeMonthlyPayment: safe, disposableIncome, ratio: null };
  }
  const ratio = disposableIncome > 0 ? monthlyPayment / disposableIncome : Infinity;
  const pct = ratio * 100;
  if (monthlyPayment <= safe) {
    return { verdict: 'buy' as Verdict, verdictText: '买买买', reason: `月供占可支配收入 ${pct.toFixed(0)}%，压力可控，买买买！`, safeMonthlyPayment: safe, disposableIncome, ratio };
  }
  if (ratio <= 0.5) {
    return { verdict: 'consider' as Verdict, verdictText: '理性考虑', reason: `月供占可支配收入 ${pct.toFixed(0)}%，会明显压缩生活质量，建议理性考虑或提高首付。`, safeMonthlyPayment: safe, disposableIncome, ratio };
  }
  return { verdict: 'avoid' as Verdict, verdictText: '买个 der', reason: `月供已超可支配收入一半（${pct.toFixed(0)}%），强行上车风险很高，先攒钱吧（买个 der）。`, safeMonthlyPayment: safe, disposableIncome, ratio };
}

function round2(x: number) {
  return Math.round(x * 100) / 100;
}

export function calcEnergyCost(
  energyType: EnergyType,
  fuelConsumption: number,
  powerConsumption: number,
  monthlyKm = 1000,
  fuelPrice = 7.5,
  electricityPrice = 0.6,
) {
  const factor = monthlyKm / 100;
  let fuelYuan = 0;
  let elecYuan = 0;
  if (energyType === 'gas' || energyType === 'hybrid') fuelYuan = fuelConsumption * fuelPrice * factor;
  if (energyType === 'ev') elecYuan = powerConsumption * electricityPrice * factor;
  return {
    fuelCostMonth: round4(fuelYuan / 10000),
    electricityCostMonth: round4(elecYuan / 10000),
    energyCostMonth: round4((fuelYuan + elecYuan) / 10000),
  };
}

function round4(x: number) {
  return Math.round(x * 10000) / 10000;
}

export function runPlan(params: CalcParams): CalcResult {
  const price = params.price;
  const plan =
    params.mode === 'loan'
      ? calcLoanPlan(price, params.down_payment_ratio ?? 0.3, params.months ?? 36, params.annual_rate ?? 0.045)
      : calcFullPlan(price);
  const energy = calcEnergyCost(
    params.energy_type,
    params.fuel_consumption,
    params.power_consumption,
    params.monthly_km ?? 1000,
    params.fuel_price ?? 7.5,
    params.electricity_price ?? 0.6,
  );
  const effectiveExpense = params.monthly_expense + energy.energyCostMonth;
  const disposableIncome = params.income - effectiveExpense;
  const safeRatio = params.safe_ratio ?? SAFE_RATIO;
  const safe = disposableIncome * safeRatio;
  const dec = evaluate(params.mode, plan.monthlyPayment ?? 0, disposableIncome, params.savings, plan.landedPrice, effectiveExpense, safeRatio);
  return {
    mode: params.mode,
    landed_price: round2(plan.landedPrice),
    purchase_tax: round2(plan.purchaseTax),
    insurance: round2(plan.insurance),
    misc_fee: round2(plan.miscFee),
    down_payment: round2(plan.downPayment ?? plan.landedPrice),
    loan_amount: round2(plan.loanAmount ?? 0),
    monthly_payment: round2(plan.monthlyPayment ?? 0),
    total_interest: round2(plan.totalInterest ?? 0),
    disposable_income: round2(disposableIncome),
    safe_monthly_payment: round2(safe),
    energy_type: params.energy_type,
    fuel_cost_month: energy.fuelCostMonth,
    electricity_cost_month: energy.electricityCostMonth,
    energy_cost_month: energy.energyCostMonth,
    monthly_km: params.monthly_km ?? 1000,
    verdict: dec.verdict,
    verdict_text: dec.verdictText,
    reason: dec.reason,
  };
}
