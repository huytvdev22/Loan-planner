import React, { useState, useEffect, ChangeEvent } from 'react';
import { Input, InputProps } from './Input';
import { cn } from '@/src/lib/utils';

export type CurrencyInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: number;
  onValueChange: (value: number) => void;
};

export function CurrencyInput({ value, onValueChange, className, ...props }: CurrencyInputProps) {
  const [inputValue, setInputValue] = useState<string>('');

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setInputValue(new Intl.NumberFormat('vi-VN').format(value));
    } else {
      setInputValue('');
    }
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    const numValue = parseInt(rawValue, 10);
    
    if (isNaN(numValue)) {
      setInputValue('');
      onValueChange(0);
    } else {
      setInputValue(new Intl.NumberFormat('vi-VN').format(numValue));
      onValueChange(numValue);
    }
  };

  return (
    <div className="relative">
      <Input
        type="text"
        value={inputValue}
        onChange={handleChange}
        className={cn("pr-8 text-right font-mono", className)}
        {...props}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none font-medium">
        ₫
      </span>
    </div>
  );
}
