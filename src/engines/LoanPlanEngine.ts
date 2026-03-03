import { LoanConfig, ScheduleRow, LoanSummary } from '../lib/types';
import { round, addMonths, daysBetween } from '../lib/utils';

export class LoanPlanEngine {
  static generateSchedule(config: LoanConfig): ScheduleRow[] {
    const {
      principal,
      durationMonths,
      interestRateYearly,
      promotionalRateYearly,
      promotionalMonths,
      paymentMethod,
      startDate,
      firstPaymentDate,
    } = config;

    const schedule: ScheduleRow[] = [];
    let currentBalance = principal;

    if (paymentMethod === 'equal_principal') {
      const principalPayment = round(principal / durationMonths);

      for (let month = 1; month <= durationMonths; month++) {
        const date = addMonths(config.firstPaymentDate, month - 1);
        const yearlyRate = month <= promotionalMonths ? promotionalRateYearly : interestRateYearly;
        
        let interestPayment = 0;
        if (month === 1) {
          const days = daysBetween(startDate, firstPaymentDate);
          interestPayment = round(currentBalance * (yearlyRate / 100 / 365) * days);
        } else {
          const monthlyRate = yearlyRate / 100 / 12;
          interestPayment = round(currentBalance * monthlyRate);
        }

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

        let interestPayment = 0;
        if (month === 1) {
          const days = daysBetween(startDate, firstPaymentDate);
          interestPayment = round(currentBalance * (yearlyRate / 100 / 365) * days);
        } else {
          interestPayment = round(currentBalance * monthlyRate);
        }
        
        let totalPayment = 0;
        if (monthlyRate === 0) {
          totalPayment = round(currentBalance / remainingMonths);
        } else {
          // Standard PMT calculation for the remaining balance and term
          // Note: For the first month, we use the standard PMT based on the original principal and full duration
          // to ensure the installment amount is consistent with what the user expects for an annuity.
          // However, strictly speaking, if the first period is odd, the PMT might need adjustment.
          // Here we keep the PMT constant based on the *current* parameters for the *remaining* term?
          // No, for equal_installment, the total payment should be constant (mostly).
          
          // Let's calculate the standard PMT based on the *original* principal and duration for the first month,
          // and then for subsequent months, we might need to stick to that PMT or recalculate?
          
          // Actually, the existing logic recalculates PMT every month based on remaining balance and term.
          // This effectively handles "re-amortization" if the balance goes off track (e.g. due to rounding).
          // But for the first month, if we change interest, and keep the PMT formula, 
          // the PMT formula `(currentBalance * monthlyRate * ...)` uses `monthlyRate`.
          // It doesn't know about the day-based interest of the current month.
          
          // If we want a fixed monthly payment (Annuity), we should calculate it ONCE.
          // const fixedTotalPayment = ...
          
          // But the current implementation recalculates it inside the loop:
          // totalPayment = round((currentBalance * monthlyRate * ...))
          
          // If I use this formula for month 1, it will give the standard monthly payment.
          // Then I subtract the day-based interest.
          // This results in a different principal payment.
          // This seems correct for "Fixed Payment, Odd First Period Interest".
          
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
