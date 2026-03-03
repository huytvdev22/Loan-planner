import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';

interface ChartData {
  month: number;
  planRemaining: number;
  actualRemaining?: number;
  date?: string;
}

interface OutstandingChartProps {
  data: ChartData[];
  showActual?: boolean;
}

export function OutstandingChart({ data, showActual = false }: OutstandingChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-[400px] w-full mt-8"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 40,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            tickFormatter={(value) => `Tháng ${value}`}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}Tr`}
          />
          <Tooltip
            formatter={(value: any) => [formatCurrency(Number(value)), 'Dư nợ']}
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                const data = payload[0].payload as ChartData;
                if (data.date) {
                  const [year, month] = data.date.split('-');
                  return `Tháng ${label} (${month}/${year})`;
                }
              }
              return `Tháng ${label}`;
            }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line
            type="monotone"
            dataKey="planRemaining"
            name="Kế hoạch"
            stroke="#4F46E5"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6 }}
          />
          {showActual && (
            <Line
              type="monotone"
              dataKey="actualRemaining"
              name="Thực tế"
              stroke="#10B981"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
