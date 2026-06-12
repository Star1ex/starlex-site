import { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { dateFromPickerValue, toPickerDateValue } from './DatePickerMenu.utils.js';

interface DatePickerMenuProps {
  value?: string | null;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  iconSize?: number;
  iconStrokeWidth?: number;
  align?: 'start' | 'center' | 'end';
  ariaLabel?: string;
  emptyLabel?: string;
  formatValue?: (value?: string | null) => string;
  parseValue?: (value?: string | null) => Date | null;
  serializeDate?: (date: Date) => string | null;
  onChange: (value: string | null) => void;
}

function sameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function defaultFormatValue(value?: string | null, emptyLabel = 'No date') {
  const date = dateFromPickerValue(value);
  if (!date) return emptyLabel;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function DatePickerMenu({
  value,
  disabled = false,
  className = 'tasks-date-trigger',
  contentClassName = 'sx-glass sx-glass--menu sx-glass--floating tasks-calendar-menu liquid-date-menu',
  iconSize = 12,
  iconStrokeWidth,
  align = 'end',
  ariaLabel = 'Select date',
  emptyLabel = 'No date',
  formatValue,
  parseValue = dateFromPickerValue,
  serializeDate = toPickerDateValue,
  onChange,
}: DatePickerMenuProps) {
  const selected = parseValue(value);
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => selected ?? today);
  const monthLabel = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const label = formatValue ? formatValue(value) : defaultFormatValue(value, emptyLabel);

  const cells = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, monthIndex, 0).getDate();

    return Array.from({ length: 42 }, (_, index) => {
      const dayNumber = index - firstDay + 1;
      if (dayNumber < 1) {
        return {
          date: new Date(year, monthIndex - 1, daysInPrevMonth + dayNumber),
          current: false,
        };
      }
      if (dayNumber > daysInMonth) {
        return {
          date: new Date(year, monthIndex + 1, dayNumber - daysInMonth),
          current: false,
        };
      }
      return {
        date: new Date(year, monthIndex, dayNumber),
        current: true,
      };
    });
  }, [month]);

  return (
    <DropdownMenu
      open={open}
      onOpenChange={(next) => {
        if (disabled) return;
        setOpen(next);
        if (next) setMonth(selected ?? new Date());
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={className}
          disabled={disabled}
          onClick={(event) => event.stopPropagation()}
          aria-label={ariaLabel}
        >
          <CalendarDays size={iconSize} strokeWidth={iconStrokeWidth} />
          <span>{label}</span>
          <ChevronDown size={12} className="tasks-inline-chevron project-date-chevron" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className={contentClassName}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="tasks-calendar-head">
          <button
            type="button"
            onClick={() => setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft size={14} />
          </button>
          <span>{monthLabel}</span>
          <button
            type="button"
            onClick={() => setMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            aria-label="Next month"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="tasks-calendar-grid tasks-calendar-weekdays">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <span key={`${day}-${index}`}>{day}</span>
          ))}
        </div>
        <div className="tasks-calendar-grid">
          {cells.map((cell) => (
            <button
              key={cell.date.toISOString()}
              type="button"
              className="tasks-calendar-day"
              data-muted={!cell.current ? 'true' : undefined}
              data-selected={sameDay(cell.date, selected) ? 'true' : undefined}
              data-today={sameDay(cell.date, today) ? 'true' : undefined}
              onClick={() => {
                onChange(serializeDate(cell.date));
                setOpen(false);
              }}
            >
              {cell.date.getDate()}
            </button>
          ))}
        </div>
        <div className="tasks-calendar-footer">
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => {
              onChange(serializeDate(today));
              setOpen(false);
            }}
          >
            Today
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
