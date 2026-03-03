import React, { useState } from 'react';
import { LoanCalculator } from './components/LoanCalculator';
import { PlanVsActual } from './components/PlanVsActual';
import { History } from './components/History';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator, LineChart, Landmark, History as HistoryIcon } from 'lucide-react';
import { HistoryEntry } from './lib/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'comparison' | 'history'>('calculator');
  const [loadedCalculatorData, setLoadedCalculatorData] = useState<any>(null);
  const [loadedComparisonData, setLoadedComparisonData] = useState<any>(null);

  const handleLoadHistory = (entry: HistoryEntry) => {
    if (entry.type === 'calculator') {
      setLoadedCalculatorData(entry.data);
      setActiveTab('calculator');
    } else {
      setLoadedComparisonData(entry.data);
      setActiveTab('comparison');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center gap-2">
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <Landmark className="h-6 w-6 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight text-gray-900">Loan Planner</span>
              </div>
              <div className="flex ml-4 sm:ml-8 space-x-4 sm:space-x-8">
                <button
                  onClick={() => setActiveTab('calculator')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === 'calculator'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <Calculator className="w-4 h-4 mr-2 hidden sm:block" />
                  Tính lịch vay
                </button>
                <button
                  onClick={() => setActiveTab('comparison')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === 'comparison'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <LineChart className="w-4 h-4 mr-2 hidden sm:block" />
                  So sánh
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'border-indigo-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <HistoryIcon className="w-4 h-4 mr-2 hidden sm:block" />
                  Lịch sử
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'calculator' ? (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Tính lịch vay ngân hàng</h1>
                <p className="mt-2 text-lg text-gray-600">
                  Lập kế hoạch trả nợ chi tiết với các tùy chọn lãi suất ưu đãi và phương thức thanh toán.
                </p>
              </div>
              <LoanCalculator initialData={loadedCalculatorData} />
            </motion.div>
          ) : activeTab === 'comparison' ? (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">So sánh Kế hoạch & Thực tế</h1>
                <p className="mt-2 text-lg text-gray-600">
                  Mô phỏng trả nợ trước hạn, tính phí phạt và so sánh hiệu quả tài chính.
                </p>
              </div>
              <PlanVsActual initialData={loadedComparisonData} />
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Lịch sử tính toán</h1>
                <p className="mt-2 text-lg text-gray-600">
                  Xem lại các phương án vay đã lưu trước đó.
                </p>
              </div>
              <History onLoadHistory={handleLoadHistory} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
