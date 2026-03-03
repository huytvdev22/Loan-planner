import { LoanSummary } from '../lib/types';

export interface ComparisonResult {
  plan: LoanSummary;
  actual: LoanSummary;
  diff: {
    totalPrincipal: number;
    totalInterest: number;
    totalPenalty: number;
    totalPayment: number;
    durationMonths: number;
  };
}

export class ComparisonEngine {
  static compare(plan: LoanSummary, actual: LoanSummary): ComparisonResult {
    return {
      plan,
      actual,
      diff: {
        totalPrincipal: actual.totalPrincipal - plan.totalPrincipal,
        totalInterest: actual.totalInterest - plan.totalInterest,
        totalPenalty: actual.totalPenalty - plan.totalPenalty,
        totalPayment: actual.totalPayment - plan.totalPayment,
        durationMonths: actual.durationMonths - plan.durationMonths,
      },
    };
  }
}
