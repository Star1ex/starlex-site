import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EMPTY_VALUE = '__starlex_empty__';

export interface DarkSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface DarkSelectProps {
  value: string;
  options: DarkSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

function encode(value: string) {
  return value === '' ? EMPTY_VALUE : value;
}

function decode(value: string) {
  return value === EMPTY_VALUE ? '' : value;
}

export const DarkSelect: React.FC<DarkSelectProps> = ({
  value,
  options,
  onChange,
  disabled,
  className,
  placeholder = 'Select...',
}) => (
  <Select value={encode(value)} onValueChange={(next) => onChange(decode(next))} disabled={disabled}>
    <SelectTrigger
      className={
        className ??
        'w-full h-11 px-3 rounded-xl text-body-md text-white bg-white/5 border border-white/10 outline-none focus:border-white/25 transition-all disabled:opacity-40'
      }
    >
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent
      position="popper"
      align="start"
      className="glass-menu z-[80] text-white min-w-[var(--radix-select-trigger-width)] rounded-xl p-1 outline-none ring-0"
    >
      {options.map((option) => (
        <SelectItem
          key={option.value || EMPTY_VALUE}
          value={encode(option.value)}
          disabled={option.disabled}
          className="glass-menu-item cursor-pointer rounded-lg px-2.5 py-2 text-label-sm data-[highlighted]:bg-white/7 data-[highlighted]:text-white data-[state=checked]:bg-white/5 data-[state=checked]:text-white"
        >
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
