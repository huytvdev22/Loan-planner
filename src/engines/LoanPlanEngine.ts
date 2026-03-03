import { LoanConfig, ScheduleRow, LoanSummary } from '../lib/types';
import { round, addMonths } from '../lib/utils';

export class LoanPlanEngine {
  static generateSchedule(config: LoanConfig): ScheduleRow[] {
    const {
      principal,
      durationMonths,
      interestRateYearly,
      promotionalRateYearly,
      promotionalMonths,
      paymentMethod,
    } = config;

    const schedule: ScheduleRow[] = [];
    let currentBalance = principal;

    if (paymentMethod === 'equal_principal') {
      const principalPayment = round(principal / durationMonths);

      for (let month = 1; month <= durationMonths; month++) {
        const date = addMonths(config.firstPaymentDate, month - 1);
        const yearlyRate = month <= promotionalMonths ? promotionalRateYearly : interestRateYearly;
        const monthlyRate = yearlyRate / 100 / 12;
        
        const interestPayment = round(currentBalance * monthlyRate);
        const actualPrincipalPayment = month === durationMonths || principalPayment > currentBalance ? currentBalance : principalPayment;
        const totalPayment = actualPrincipalPayment + interestPayment;
        const endingBalance = currentBalance - actualPrincipalPayment;

        schedule.push({
          month,
          date,
          beginningBalance: currentBalance,
          principalPayment: actualPrincipalPayment,
          interestPayment,
          totalPayment,
          endingBalance: Math.max(0, endingBalance),
        });

        currentBalance = endingBalance;
      }
    } else if (paymentMethod === 'equal_installment') {
      for (let month = 1; month <= durationMonths; month++) {
        const date = addMonths(config.firstPaymentDate, month - 1);
        const yearlyRate = month <= promotionalMonths ? promotionalRateYearly : interestRateYearly;
        const monthlyRate = yearlyRate / 100 / 12;
        const remainingMonths = durationMonths - month + 1;

        const interestPayment = round(currentBalance * monthlyRate);
        
        let totalPayment = 0;
        if (monthlyRate === 0) {
          totalPayment = round(currentBalance / remainingMonths);
        } else {
          totalPayment = round(
            (currentBalance * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) /
            (Math.pow(1 + monthlyRate, remainingMonths) - 1)
          );
        }

        let principalPayment = totalPayment - interestPayment;
        
        if (month === durationMonths || principalPayment > currentBalance) {
          principalPayment = currentBalance;
          totalPayment = principalPayment + interestPayment;
        }

        const endingBalance = currentBalance - principalPayment;

        schedule.push({
          month,
          date,
          beginningBalance: currentBalance,
          principalPayment,
          interestPayment,
          totalPayment,
          endingBalance: Math.max(0, endingBalance),
        });

        currentBalance = endingBalance;
      }
    }

    return schedule;
  }

  static calculateSummary(schedule: ScheduleRow[]): LoanSummary {
    return schedule.reduce(
      (acc, row) => {
        acc.totalPrincipal += row.principalPayment + (row.extraPrincipal || 0);
        acc.totalInterest += row.interestPayment;
        acc.totalPenalty += row.penaltyFee || 0;
        acc.totalPayment += row.totalPayment;
        acc.durationMonths = Math.max(acc.durationMonths, row.month);
        return acc;
      },
      {
        totalPrincipal: 0,
        totalInterest: 0,
        totalPenalty: 0,
        totalPayment: 0,
        durationMonths: 0,
      }
    );
  }
}
