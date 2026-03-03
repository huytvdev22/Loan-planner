import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Input } from './ui/Input';
import { CurrencyInput } from './ui/CurrencyInput';
import { Label } from './ui/Label';
import { Select } from './ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Button } from './ui/Button';
import { LoanConfig, ExtraPayment, PenaltyRule } from '../lib/types';
import { LoanPlanEngine } from '../engines/LoanPlanEngine';
import { ActualPaymentEngine } from '../engines/ActualPaymentEngine';
import { ComparisonEngine } from '../engines/ComparisonEngine';
import { formatCurrency, formatDate } from '../lib/utils';
import { saveHistory } from '../lib/history';
import { OutstandingChart } from './OutstandingChart';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Plus, Trash2, ArrowRightLeft, AlertCircle, CheckCircle2, TrendingDown, Play, RotateCcw } from 'lucide-react';
import { ShareButton } from './ShareButton';

const DEFAULT_CONFIG: LoanConfig = {
  principal: 1000000000,
  durationMonths: 120,
  interestRateYearly: 10.5,
  promotionalRateYearly: 8.5,
  promotionalMonths: 12,
  paymentMethod: 'equal_principal',
  startDate: new Date().toISOString().split('T')[0],
  firstPaymentDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
};

const DEFAULT_PENALTY_RULES: PenaltyRule[] = [
  { id: '1', fromMonth: 1, toMonth: 12, penaltyRate: 3 },
  { id: '2', fromMonth: 13, toMonth: 36, penaltyRate: 2 },
  { id: '3', fromMonth: 37, toMonth: 60, penaltyRate: 1 },
  { id: '4', fromMonth: 61, toMonth: 'remaining', penaltyRate: 0 },
];

const DEFAULT_EXTRA_PAYMENTS: ExtraPayment[] = [
  { id: '1', date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], amount: 200000000 },
];

export function PlanVsActual({ initialData }: { initialData?: any }) {
  const [config, setConfig] = useState<LoanConfig>(() => {
    if (initialData?.config) return initialData.config;
    const saved = localStorage.getItem('latest_comparison_config');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_CONFIG;
  });

  const [penaltyRules, setPenaltyRules] = useState<PenaltyRule[]>(() => {
    if (initialData?.penaltyRules) return initialData.penaltyRules;
    const saved = localStorage.getItem('latest_comparison_penalty_rules');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_PENALTY_RULES;
  });

  const [extraPayments, setExtraPayments] = useState<ExtraPayment[]>(() => {
    if (initialData?.extraPayments) return initialData.extraPayments;
    const saved = localStorage.getItem('latest_comparison_extra_payments');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_EXTRA_PAYMENTS;
  });

  const [calculatedConfig, setCalculatedConfig] = useState<LoanConfig | null>(initialData?.config || null);
  const [calculatedPenaltyRules, setCalculatedPenaltyRules] = useState<PenaltyRule[]>(initialData?.penaltyRules || []);
  const [calculatedExtraPayments, setCalculatedExtraPayments] = useState<ExtraPayment[]>(initialData?.extraPayments || []);

  useEffect(() => {
    if (initialData) {
      setConfig(initialData.config);
      setPenaltyRules(initialData.penaltyRules || []);
      setExtraPayments(initialData.extraPayments || []);
      setCalculatedConfig(initialData.config);
      setCalculatedPenaltyRules(initialData.penaltyRules || []);
      setCalculatedExtraPayments(initialData.extraPayments || []);
    }
  }, [initialData]);

  useEffect(() => {
    localStorage.setItem('latest_comparison_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('latest_comparison_penalty_rules', JSON.stringify(penaltyRules));
  }, [penaltyRules]);

  useEffect(() => {
    localStorage.setItem('latest_comparison_extra_payments', JSON.stringify(extraPayments));
  }, [extraPayments]);

  const [showChart, setShowChart] = useState(true);

  const planSchedule = useMemo(() => calculatedConfig ? LoanPlanEngine.generateSchedule(calculatedConfig) : [], [calculatedConfig]);
  const planSummary = useMemo(() => calculatedConfig ? LoanPlanEngine.calculateSummary(planSchedule) : null, [planSchedule, calculatedConfig]);

  const actualSchedule = useMemo(
    () => calculatedConfig ? ActualPaymentEngine.generateActualSchedule(calculatedConfig, calculatedExtraPayments, calculatedPenaltyRules) : [],
    [calculatedConfig, calculatedExtraPayments, calculatedPenaltyRules]
  );
  const actualSummary = useMemo(() => calculatedConfig ? LoanPlanEngine.calculateSummary(actualSchedule) : null, [actualSchedule, calculatedConfig]);

  const comparison = useMemo(
    () => (planSummary && actualSummary) ? ComparisonEngine.compare(planSummary, actualSummary) : null,
    [planSummary, actualSummary]
  );

  const chartData = useMemo(() => {
    if (!calculatedConfig) return [];
    const data = [];
    for (let i = 1; i <= calculatedConfig.durationMonths; i++) {
      const planRow = planSchedule.find((r) => r.month === i);
      const actualRow = actualSchedule.find((r) => r.month === i);
      
      if (planRow) {
        data.push({
          month: i,
          planRemaining: planRow.endingBalance,
          actualRemaining: actualRow ? actualRow.endingBalance : undefined,
        });
      }
    }
    return data;
  }, [planSchedule, actualSchedule, calculatedConfig]);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: ['paymentMethod', 'startDate', 'firstPaymentDate'].includes(name) ? value : Number(value),
    }));
  };

  const handleCalculate = () => {
    setCalculatedConfig(config);
    setCalculatedPenaltyRules(penaltyRules);
    setCalculatedExtraPayments(extraPayments);
    
    saveHistory({
      id: Date.now().toString(),
      type: 'comparison',
      timestamp: Date.now(),
      name: `So sánh vay ${formatCurrency(config.principal)}`,
      data: { 
        config,
        penaltyRules,
        extraPayments
      }
    });
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setPenaltyRules(DEFAULT_PENALTY_RULES);
    setExtraPayments(DEFAULT_EXTRA_PAYMENTS);
    setCalculatedConfig(null);
    setCalculatedPenaltyRules([]);
    setCalculatedExtraPayments([]);
  };

  const addPenaltyRule = () => {
    setPenaltyRules([
      ...penaltyRules,
      { id: Date.now().toString(), fromMonth: 1, toMonth: 12, penaltyRate: 0 },
    ]);
  };

  const updatePenaltyRule = (id: string, field: keyof PenaltyRule, value: any) => {
    setPenaltyRules(
      penaltyRules.map((rule) => {
        if (rule.id === id) {
          if (field === 'toMonth' && value === 'remaining') {
            return { ...rule, [field]: value };
          }
          return { ...rule, [field]: Number(value) };
        }
        return rule;
      })
    );
  };

  const removePenaltyRule = (id: string) => {
    setPenaltyRules(penaltyRules.filter((rule) => rule.id !== id));
  };

  const addExtraPayment = () => {
    setExtraPayments([
      ...extraPayments,
      { id: Date.now().toString(), date: new Date().toISOString().split('T')[0], amount: 0 },
    ]);
  };

  const updateExtraPayment = (id: string, field: keyof ExtraPayment, value: any) => {
    setExtraPayments(
      extraPayments.map((payment) =>
        payment.id === id ? { ...payment, [field]: value } : payment
      )
    );
  };

  const removeExtraPayment = (id: string) => {
    setExtraPayments(extraPayments.filter((payment) => payment.id !== id));
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-600" />
                  Cấu hình khoản vay
                </CardTitle>
                <ShareButton type="comparison" data={{ config, penaltyRules, extraPayments }} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="principal">Số tiền vay</Label>
                <CurrencyInput id="principal" name="principal" value={config.principal} onValueChange={(val) => setConfig({ ...config, principal: val })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="durationMonths">Thời gian (tháng)</Label>
                  <Input id="durationMonths" name="durationMonths" type="number" value={config.durationMonths} onChange={handleConfigChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Hình thức</Label>
                  <Select id="paymentMethod" name="paymentMethod" value={config.paymentMethod} onChange={handleConfigChange}>
                    <option value="equal_principal">Gốc đều</option>
                    <option value="equal_installment">Góp đều</option>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interestRateYearly">Lãi thường (%)</Label>
                  <Input id="interestRateYearly" name="interestRateYearly" type="number" step={0.1} value={config.interestRateYearly} onChange={handleConfigChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="promotionalRateYearly">Lãi ưu đãi (%)</Label>
                  <Input id="promotionalRateYearly" name="promotionalRateYearly" type="number" step={0.1} value={config.promotionalRateYearly} onChange={handleConfigChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Ngày vay</Label>
                  <Input id="startDate" name="startDate" type="date" value={config.startDate} onChange={handleConfigChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstPaymentDate">Ngày trả đầu</Label>
                  <Input id="firstPaymentDate" name="firstPaymentDate" type="date" value={config.firstPaymentDate} onChange={handleConfigChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="promotionalMonths">Số tháng ưu đãi</Label>
                <Input id="promotionalMonths" name="promotionalMonths" type="number" value={config.promotionalMonths} onChange={handleConfigChange} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                  Phí phạt trả trước
                </CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={addPenaltyRule}>
                <Plus className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence>
                {penaltyRules.map((rule) => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-end gap-2"
                  >
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Từ tháng</Label>
                        <Input type="number" value={rule.fromMonth} onChange={(e) => updatePenaltyRule(rule.id, 'fromMonth', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Đến tháng</Label>
                        <Select value={rule.toMonth} onChange={(e) => updatePenaltyRule(rule.id, 'toMonth', e.target.value)}>
                          <option value="remaining">Hết kỳ</option>
                          {[...Array(config.durationMonths)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Phí (%)</Label>
                        <Input type="number" step={0.1} value={rule.penaltyRate} onChange={(e) => updatePenaltyRule(rule.id, 'penaltyRate', e.target.value)} />
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removePenaltyRule(rule.id)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-emerald-500" />
                  Trả thêm gốc
                </CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={addExtraPayment}>
                <Plus className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence>
                {extraPayments.map((payment) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-end gap-2"
                  >
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Ngày trả</Label>
                        <Input type="date" value={payment.date} onChange={(e) => updateExtraPayment(payment.id, 'date', e.target.value)} />
                      </div>
                      <div className="space-y-1 col-span-2">
                        <Label className="text-xs">Số tiền</Label>
                        <CurrencyInput value={payment.amount} onValueChange={(val) => updateExtraPayment(payment.id, 'amount', val)} />
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeExtraPayment(payment.id)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" className="w-1/3 py-6 text-lg" onClick={handleReset}>
              <RotateCcw className="w-5 h-5 mr-2" />
              Đặt lại
            </Button>
            <Button className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-lg shadow-lg" onClick={handleCalculate}>
              <Play className="w-5 h-5 mr-2" />
              Tính toán so sánh
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {calculatedConfig && comparison ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
                    So sánh Kế hoạch & Thực tế
                  </CardTitle>
                </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chỉ tiêu</TableHead>
                    <TableHead className="text-right">Kế hoạch</TableHead>
                    <TableHead className="text-right">Thực tế</TableHead>
                    <TableHead className="text-right">Chênh lệch</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Tổng tiền gốc</TableCell>
                    <TableCell className="text-right">{formatCurrency(comparison.plan.totalPrincipal)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(comparison.actual.totalPrincipal)}</TableCell>
                    <TableCell className="text-right text-gray-500">-</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Tổng tiền lãi</TableCell>
                    <TableCell className="text-right">{formatCurrency(comparison.plan.totalInterest)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(comparison.actual.totalInterest)}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">
                      {comparison.diff.totalInterest < 0 ? `Tiết kiệm ${formatCurrency(Math.abs(comparison.diff.totalInterest))}` : formatCurrency(comparison.diff.totalInterest)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Tổng tiền phạt</TableCell>
                    <TableCell className="text-right">{formatCurrency(comparison.plan.totalPenalty)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(comparison.actual.totalPenalty)}</TableCell>
                    <TableCell className="text-right font-bold text-rose-600">
                      {comparison.diff.totalPenalty > 0 ? `Phát sinh ${formatCurrency(comparison.diff.totalPenalty)}` : '-'}
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-indigo-50/50">
                    <TableCell className="font-bold text-indigo-900">Tổng tiền phải trả</TableCell>
                    <TableCell className="text-right font-bold text-indigo-900">{formatCurrency(comparison.plan.totalPayment)}</TableCell>
                    <TableCell className="text-right font-bold text-indigo-900">{formatCurrency(comparison.actual.totalPayment)}</TableCell>
                    <TableCell className="text-right font-bold text-indigo-900">
                      {comparison.diff.totalPayment < 0 ? `Giảm ${formatCurrency(Math.abs(comparison.diff.totalPayment))}` : `Tăng ${formatCurrency(comparison.diff.totalPayment)}`}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Thời gian vay</TableCell>
                    <TableCell className="text-right">{comparison.plan.durationMonths} tháng</TableCell>
                    <TableCell className="text-right">
                      {comparison.actual.durationMonths} tháng
                      {comparison.actual.durationMonths < comparison.plan.durationMonths && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                          Tất toán sớm
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">
                      {comparison.diff.durationMonths < 0 ? `Rút ngắn ${Math.abs(comparison.diff.durationMonths)} tháng` : '-'}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Biểu đồ so sánh dư nợ</CardTitle>
                <CardDescription>Kế hoạch vs Thực tế</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowChart(!showChart)}>
                {showChart ? 'Ẩn biểu đồ' : 'Hiện biểu đồ'}
              </Button>
            </CardHeader>
              {showChart && (
                <CardContent>
                  <OutstandingChart data={chartData} showActual={true} />
                </CardContent>
              )}
            </Card>
            </>
          ) : (
            <Card className="h-full min-h-[400px] flex items-center justify-center border-dashed">
              <CardContent className="flex flex-col items-center justify-center text-gray-500">
                <ArrowRightLeft className="w-12 h-12 mb-4 text-gray-300" />
                <p>Nhập thông tin và nhấn "Tính toán so sánh" để xem kết quả</p>
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      {calculatedConfig && comparison && (
        <Card>
          <CardHeader>
            <CardTitle>Lịch trả nợ thực tế</CardTitle>
          </CardHeader>
          <CardContent>
            <Table wrapperClassName="max-h-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Tháng</TableHead>
                  <TableHead className="w-28">Ngày trả</TableHead>
                  <TableHead className="text-right">Gốc trả</TableHead>
                  <TableHead className="text-right">Lãi trả</TableHead>
                  <TableHead className="text-right">Gốc trả thêm</TableHead>
                  <TableHead className="text-right">Phí phạt</TableHead>
                  <TableHead className="text-right font-bold">Tổng trả</TableHead>
                  <TableHead className="text-right">Dư nợ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actualSchedule.map((row) => (
                  <TableRow key={row.month} className={row.extraPrincipal && row.extraPrincipal > 0 ? "bg-emerald-50/50" : ""}>
                    <TableCell className="font-medium">{row.month}</TableCell>
                    <TableCell className="text-gray-500">{formatDate(row.date)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.principalPayment)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.interestPayment)}</TableCell>
                    <TableCell className="text-right text-emerald-600 font-medium">
                      {row.extraPrincipal && row.extraPrincipal > 0 ? formatCurrency(row.extraPrincipal) : '-'}
                    </TableCell>
                    <TableCell className="text-right text-rose-600 font-medium">
                      {row.penaltyFee && row.penaltyFee > 0 ? formatCurrency(row.penaltyFee) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-indigo-700">{formatCurrency(row.totalPayment)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.endingBalance)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
