import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export function round(value: number): number {
  return Math.round(value);
}

export function addMonths(dateString: string, months: number): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const day = date.getDate();
  date.setMonth(date.getMonth() + months);
  
  // Handle edge cases like Jan 31 + 1 month -> Feb 28/29
  if (date.getDate() !== day) {
    date.setDate(0);
  }
  
  return date.toISOString().split('T')[0];
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}
