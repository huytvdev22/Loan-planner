import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { HistoryEntry } from '../lib/types';
import { getHistory, deleteHistoryItem, clearHistory } from '../lib/history';
import { formatCurrency } from '../lib/utils';
import { Calculator, LineChart, Trash2, Clock } from 'lucide-react';

interface HistoryProps {
  onLoadHistory: (entry: HistoryEntry) => void;
}

export function History({ onLoadHistory }: HistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteHistoryItem(id);
    setHistory(getHistory());
  };

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả lịch sử?')) {
      clearHistory();
      setHistory([]);
    }
  };

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Clock className="w-12 h-12 mb-4 text-gray-300" />
          <p>Chưa có lịch sử tính toán nào.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={handleClearAll}>
          <Trash2 className="w-4 h-4 mr-2" />
          Xóa tất cả
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((entry) => (
          <Card 
            key={entry.id} 
            className="cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
            onClick={() => onLoadHistory(entry)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {entry.type === 'calculator' ? (
                    <Calculator className="w-4 h-4 text-indigo-500" />
                  ) : (
                    <LineChart className="w-4 h-4 text-emerald-500" />
                  )}
                  <span className="text-xs font-medium text-gray-500">
                    {entry.type === 'calculator' ? 'Tính lịch vay' : 'So sánh'}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-gray-400 hover:text-rose-500"
                  onClick={(e) => handleDelete(e, entry.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <CardTitle className="text-lg mt-2">{entry.name}</CardTitle>
              <CardDescription className="text-xs">
                {new Date(entry.timestamp).toLocaleString('vi-VN')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Số tiền:</span>
                  <span className="font-medium">{formatCurrency(entry.data.config.principal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Thời gian:</span>
                  <span className="font-medium">{entry.data.config.durationMonths} tháng</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Lãi suất:</span>
                  <span className="font-medium">{entry.data.config.interestRateYearly}%/năm</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
