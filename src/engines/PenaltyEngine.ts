import { PenaltyRule } from '../lib/types';
import { round } from '../lib/utils';

export class PenaltyEngine {
  static calculatePenalty(rules: PenaltyRule[], month: number, amount: number): number {
    if (amount <= 0) return 0;

    const applicableRule = rules.find((rule) => {
      const from = rule.fromMonth;
      const to = rule.toMonth === 'remaining' ? Infinity : rule.toMonth;
      return month >= from && month <= to;
    });

    if (!applicableRule) return 0;

    return round(amount * (applicableRule.penaltyRate / 100));
  }
}
