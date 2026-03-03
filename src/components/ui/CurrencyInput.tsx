import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import { Input, InputProps } from './Input';
import { cn } from '@/src/lib/utils';

export type CurrencyInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: number;
  onValueChange: (value: number) => void;
};

export function CurrencyInput({ value, onValueChange, className, ...props }: CurrencyInputProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorPosition = useRef<number | null>(null);

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setInputValue(new Intl.NumberFormat('vi-VN').format(value));
    } else {
      setInputValue('');
    }
  }, [value]);

  useEffect(() => {
    if (cursorPosition.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(cursorPosition.current, cursorPosition.current);
      cursorPosition.current = null;
    }
  }, [inputValue]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const selectionStart = input.selectionStart;
    const newValue = input.value;

    const rawValue = newValue.replace(/[^0-9]/g, '');
    const numValue = parseInt(rawValue, 10);
    
    let formattedValue = '';
    if (!isNaN(numValue)) {
      formattedValue = new Intl.NumberFormat('vi-VN').format(numValue);
    }

    if (selectionStart !== null) {
      const beforeCursorNew = newValue.substring(0, selectionStart);
      const digitsBeforeCursor = beforeCursorNew.replace(/[^0-9]/g, '').length;
      
      let digitsCount = 0;
      let newCursorPos = 0;
      for (let i = 0; i < formattedValue.length; i++) {
        if (digitsCount === digitsBeforeCursor) {
          break;
        }
        if (/[0-9]/.test(formattedValue[i])) {
          digitsCount++;
        }
        newCursorPos = i + 1;
      }
      cursorPosition.current = newCursorPos;
    }

    setInputValue(formattedValue);
    onValueChange(isNaN(numValue) ? 0 : numValue);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
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
