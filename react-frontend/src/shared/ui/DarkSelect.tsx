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
        'w-full h-11 px-3 rounded-xl text-body-md text-[color:var(--sx-text)] bg-[color:var(--sx-panel)] border border-[color:var(--sx-border)] outline-none focus:border-[color:var(--sx-border-strong)] transition-all disabled:opacity-40'
      }
    >
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent
      position="popper"
      align="start"
      className="glass-menu z-[80] text-[color:var(--sx-text)] min-w-[var(--radix-select-trigger-width)] rounded-xl p-1 outline-none ring-0"
    >
      {options.map((option) => (
        <SelectItem
          key={option.value || EMPTY_VALUE}
          value={encode(option.value)}
          disabled={option.disabled}
          className="glass-menu-item cursor-pointer rounded-lg px-2.5 py-2 text-label-sm data-[highlighted]:bg-[color:var(--sx-control)] data-[highlighted]:text-[color:var(--sx-text)] data-[state=checked]:bg-[color:var(--sx-control)] data-[state=checked]:text-[color:var(--sx-text)]"
        >
          {option.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
