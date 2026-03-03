export type PaymentMethod = 'equal_principal' | 'equal_installment';

export interface LoanConfig {
  principal: number;
  durationMonths: number;
  interestRateYearly: number;
  promotionalRateYearly: number;
  promotionalMonths: number;
  paymentMethod: PaymentMethod;
  startDate: string;
  firstPaymentDate: string;
}

export interface PenaltyRule {
  id: string;
  fromMonth: number;
  toMonth: number | 'remaining';
  penaltyRate: number;
}

export interface ExtraPayment {
  id: string;
  date: string;
  amount: number;
}

export interface ScheduleRow {
  month: number;
  date: string;
  beginningBalance: number;
  principalPayment: number;
  interestPayment: number;
  totalPayment: number;
  endingBalance: number;
  extraPrincipal?: number;
  penaltyFee?: number;
}

export interface LoanSummary {
  totalPrincipal: number;
  totalInterest: number;
  totalPenalty: number;
  totalPayment: number;
  durationMonths: number;
}

export interface HistoryEntry {
  id: string;
  type: 'calculator' | 'comparison';
  timestamp: number;
  name: string;
  data: {
    config: LoanConfig;
    penaltyRules?: PenaltyRule[];
    extraPayments?: ExtraPayment[];
  };
}
