import { LoanConfig, ExtraPayment, PenaltyRule, ScheduleRow } from '../lib/types';
import { round, addMonths, daysBetween } from '../lib/utils';
import { PenaltyEngine } from './PenaltyEngine';

export class ActualPaymentEngine {
  static generateActualSchedule(
    config: LoanConfig,
    extraPayments: ExtraPayment[],
    penaltyRules: PenaltyRule[]
  ): ScheduleRow[] {
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
    
    const originalPrincipalPayment = round(principal / durationMonths);

    for (let month = 1; month <= durationMonths; month++) {
      if (currentBalance <= 0) break;

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
      
      let principalPayment = 0;
      let totalPayment = 0;

      if (paymentMethod === 'equal_principal') {
        principalPayment = month === durationMonths ? currentBalance : originalPrincipalPayment;
        if (principalPayment > currentBalance) {
          principalPayment = currentBalance;
        }
        totalPayment = principalPayment + interestPayment;
      } else if (paymentMethod === 'equal_installment') {
        if (monthlyRate === 0) {
          totalPayment = round(currentBalance / remainingMonths);
        } else {
          totalPayment = round(
            (currentBalance * monthlyRate * Math.pow(1 + monthlyRate, remainingMonths)) /
            (Math.pow(1 + monthlyRate, remainingMonths) - 1)
          );
        }
        principalPayment = totalPayment - interestPayment;
        
        if (month === durationMonths || principalPayment > currentBalance) {
          principalPayment = currentBalance;
          totalPayment = principalPayment + interestPayment;
        }
      }

      // Handle extra payment
      // Find extra payments that fall into this month's period
      // A period is from (month-1)'s date to this month's date
      const prevDate = month === 1 ? config.startDate : addMonths(config.firstPaymentDate, month - 2);
      
      const extraPaymentsInPeriod = extraPayments.filter((ep) => {
        return ep.date > prevDate && ep.date <= date;
      });

      let extraPrincipal = 0;
      let penaltyFee = 0;

      for (const ep of extraPaymentsInPeriod) {
        if (ep.amount > 0) {
          const appliedExtra = Math.min(ep.amount, currentBalance - principalPayment - extraPrincipal);
          if (appliedExtra > 0) {
            extraPrincipal += appliedExtra;
            penaltyFee += PenaltyEngine.calculatePenalty(penaltyRules, month, appliedExtra);
          }
        }
      }

      const endingBalance = currentBalance - principalPayment - extraPrincipal;

      schedule.push({
        month,
        date,
        beginningBalance: currentBalance,
        principalPayment,
        interestPayment,
        totalPayment: totalPayment + extraPrincipal + penaltyFee,
        endingBalance: Math.max(0, endingBalance),
        extraPrincipal,
        penaltyFee,
      });

      currentBalance = endingBalance;
    }

    return schedule;
  }
}
