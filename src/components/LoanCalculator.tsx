import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Input } from './ui/Input';
import { CurrencyInput } from './ui/CurrencyInput';
import { Label } from './ui/Label';
import { Select } from './ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Button } from './ui/Button';
import { LoanConfig, PaymentMethod } from '../lib/types';
import { LoanPlanEngine } from '../engines/LoanPlanEngine';
import { formatCurrency, formatDate } from '../lib/utils';
import { saveHistory } from '../lib/history';
import { OutstandingChart } from './OutstandingChart';
import { motion } from 'motion/react';
import { Calculator, BarChart3, Info, Play, RotateCcw, FileDown } from 'lucide-react';
import { ShareButton } from './ShareButton';
import { exportToExcel } from '../lib/excel';

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

export function LoanCalculator({ initialData }: { initialData?: any }) {
  const [config, setConfig] = useState<LoanConfig>(() => {
    if (initialData?.config) return initialData.config;
    const saved = localStorage.getItem('latest_calculator_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_CONFIG;
  });

  const [calculatedConfig, setCalculatedConfig] = useState<LoanConfig | null>(initialData?.config || null);

  useEffect(() => {
    if (initialData?.config) {
      setConfig(initialData.config);
      setCalculatedConfig(initialData.config);
    }
  }, [initialData]);

  useEffect(() => {
    localStorage.setItem('latest_calculator_config', JSON.stringify(config));
  }, [config]);

  const [showChart, setShowChart] = useState(true);

  const schedule = useMemo(() => calculatedConfig ? LoanPlanEngine.generateSchedule(calculatedConfig) : [], [calculatedConfig]);
  const summary = useMemo(() => calculatedConfig ? LoanPlanEngine.calculateSummary(schedule) : null, [schedule, calculatedConfig]);

  const chartData = useMemo(() => {
    return schedule.map((row) => ({
      month: row.month,
      planRemaining: row.endingBalance,
      date: row.date,
    }));
  }, [schedule]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({
      ...prev,
      [name]: ['paymentMethod', 'startDate', 'firstPaymentDate'].includes(name) ? value : Number(value),
    }));
  };

  const handleCalculate = () => {
    setCalculatedConfig(config);
    saveHistory({
      id: Date.now().toString(),
      type: 'calculator',
      timestamp: Date.now(),
      name: `Vay ${formatCurrency(config.principal)} trong ${config.durationMonths} tháng`,
      data: { config }
    });
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setCalculatedConfig(null);
  };

  const handleExport = () => {
    if (!calculatedConfig || !summary) return;

    const loanInfo = [
      { 'Thông tin': 'Số tiền vay', 'Giá trị': calculatedConfig.principal },
      { 'Thông tin': 'Thời gian vay (tháng)', 'Giá trị': calculatedConfig.durationMonths },
      { 'Thông tin': 'Lãi suất thường niên (%)', 'Giá trị': calculatedConfig.interestRateYearly },
      { 'Thông tin': 'Lãi suất ưu đãi (%)', 'Giá trị': calculatedConfig.promotionalRateYearly },
      { 'Thông tin': 'Số tháng ưu đãi', 'Giá trị': calculatedConfig.promotionalMonths },
      { 'Thông tin': 'Ngày bắt đầu vay', 'Giá trị': calculatedConfig.startDate },
      { 'Thông tin': 'Ngày trả nợ đầu tiên', 'Giá trị': calculatedConfig.firstPaymentDate },
      { 'Thông tin': 'Hình thức trả nợ', 'Giá trị': calculatedConfig.paymentMethod === 'equal_principal' ? 'Trả gốc đều' : 'Trả góp đều' },
      { 'Thông tin': '', 'Giá trị': '' },
      { 'Thông tin': 'TỔNG KẾT', 'Giá trị': '' },
      { 'Thông tin': 'Tổng tiền gốc', 'Giá trị': summary.totalPrincipal },
      { 'Thông tin': 'Tổng tiền lãi', 'Giá trị': summary.totalInterest },
      { 'Thông tin': 'Tổng tiền phải trả', 'Giá trị': summary.totalPayment },
    ];

    const scheduleData = schedule.map(row => ({
      'Tháng': row.month,
      'Ngày trả': formatDate(row.date),
      'Dư nợ đầu kỳ': row.beginningBalance,
      'Gốc trả': row.principalPayment,
      'Lãi trả': row.interestPayment,
      'Tổng trả': row.totalPayment,
      'Dư nợ còn lại': row.endingBalance,
    }));

    exportToExcel(`Lich_vay_${new Date().toISOString().split('T')[0]}`, [
      { name: 'Thông tin khoản vay', data: loanInfo },
      { name: 'Lịch trả nợ', data: scheduleData },
    ]);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                Thông tin khoản vay
              </CardTitle>
              <ShareButton type="calculator" data={{ config }} />
            </div>
            <CardDescription>Nhập các thông số cơ bản của khoản vay</CardDescription>
          </CardHeader>
          {/* ... (rest of the code) */}
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="principal">Số tiền vay</Label>
              <CurrencyInput
                id="principal"
                name="principal"
                value={config.principal}
                onValueChange={(val) => setConfig({ ...config, principal: val })}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationMonths">Thời gian vay (tháng)</Label>
              <Input
                id="durationMonths"
                name="durationMonths"
                type="number"
                value={config.durationMonths}
                onChange={handleInputChange}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interestRateYearly">Lãi suất thường niên (%)</Label>
              <Input
                id="interestRateYearly"
                name="interestRateYearly"
                type="number"
                value={config.interestRateYearly}
                onChange={handleInputChange}
                step={0.1}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promotionalRateYearly">Lãi suất ưu đãi (%)</Label>
              <Input
                id="promotionalRateYearly"
                name="promotionalRateYearly"
                type="number"
                value={config.promotionalRateYearly}
                onChange={handleInputChange}
                step={0.1}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promotionalMonths">Số tháng ưu đãi</Label>
              <Input
                id="promotionalMonths"
                name="promotionalMonths"
                type="number"
                value={config.promotionalMonths}
                onChange={handleInputChange}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Ngày bắt đầu vay</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={config.startDate}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstPaymentDate">Ngày trả nợ đầu tiên</Label>
              <Input
                id="firstPaymentDate"
                name="firstPaymentDate"
                type="date"
                value={config.firstPaymentDate}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Hình thức trả nợ</Label>
              <Select
                id="paymentMethod"
                name="paymentMethod"
                value={config.paymentMethod}
                onChange={handleInputChange}
              >
                <option value="equal_principal">Trả gốc đều (Dư nợ giảm dần)</option>
                <option value="equal_installment">Trả góp đều (Annuity)</option>
              </Select>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="w-1/3" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Đặt lại
              </Button>
              <Button className="w-2/3 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleCalculate}>
                <Play className="w-4 h-4 mr-2" />
                Tính toán
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-8">
          {calculatedConfig && summary ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-indigo-50 border-indigo-100">
                  <CardContent className="p-6">
                    <div className="text-sm font-medium text-indigo-600 mb-1">Tổng tiền gốc</div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalPrincipal)}</div>
                  </CardContent>
                </Card>
                <Card className="bg-rose-50 border-rose-100">
                  <CardContent className="p-6">
                    <div className="text-sm font-medium text-rose-600 mb-1">Tổng tiền lãi</div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalInterest)}</div>
                  </CardContent>
                </Card>
                <Card className="bg-emerald-50 border-emerald-100">
                  <CardContent className="p-6">
                    <div className="text-sm font-medium text-emerald-600 mb-1">Tổng tiền phải trả</div>
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalPayment)}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Biểu đồ dư nợ</CardTitle>
                    <CardDescription>Tốc độ giảm dư nợ theo thời gian</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowChart(!showChart)}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    {showChart ? 'Ẩn biểu đồ' : 'Hiện biểu đồ'}
                  </Button>
                </CardHeader>
                {showChart && (
                  <CardContent>
                    <OutstandingChart data={chartData} />
                  </CardContent>
                )}
              </Card>
            </>
          ) : (
            <Card className="h-full min-h-[400px] flex items-center justify-center border-dashed">
              <CardContent className="flex flex-col items-center justify-center text-gray-500">
                <Calculator className="w-12 h-12 mb-4 text-gray-300" />
                <p>Nhập thông tin và nhấn "Tính toán" để xem kết quả</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {calculatedConfig && summary && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Lịch trả nợ chi tiết</CardTitle>
              <CardDescription>Bảng chi tiết số tiền phải trả hàng tháng</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <FileDown className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button>
          </CardHeader>
          <CardContent>
            <Table wrapperClassName="max-h-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Tháng</TableHead>
                  <TableHead className="w-28">Ngày trả</TableHead>
                  <TableHead className="text-right">Dư nợ đầu kỳ</TableHead>
                  <TableHead className="text-right">Gốc trả</TableHead>
                  <TableHead className="text-right">Lãi trả</TableHead>
                  <TableHead className="text-right font-bold">Tổng trả</TableHead>
                  <TableHead className="text-right">Dư nợ còn lại</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((row) => (
                  <TableRow key={row.month} className={row.month <= calculatedConfig.promotionalMonths ? "bg-indigo-50/30" : ""}>
                    <TableCell className="font-medium">{row.month}</TableCell>
                    <TableCell className="text-gray-500">{formatDate(row.date)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.beginningBalance)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.principalPayment)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.interestPayment)}</TableCell>
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
