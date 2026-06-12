import { DatePickerMenu } from '@/shared/ui/DatePickerMenu.js';
import {
  formatProjectTargetDate,
  PROJECT_LIST_ICON_STROKE,
} from './projectListUtils.js';

interface ProjectTargetDateMenuProps {
  value: string | null;
  disabled?: boolean;
  className?: string;
  iconSize?: number;
  align?: 'start' | 'center' | 'end';
  onChange: (value: string) => void;
}

export function ProjectTargetDateMenu({
  value,
  disabled = false,
  className = 'project-cell project-date-control',
  iconSize = 14,
  align = 'end',
  onChange,
}: ProjectTargetDateMenuProps) {
  return (
    <DatePickerMenu
      value={value}
      disabled={disabled}
      className={className}
      contentClassName="sx-glass sx-glass--menu sx-glass--floating tasks-calendar-menu liquid-date-menu project-calendar-menu"
      iconSize={iconSize}
      iconStrokeWidth={PROJECT_LIST_ICON_STROKE}
      align={align}
      ariaLabel="Project target date"
      formatValue={(next) => formatProjectTargetDate(next ?? null)}
      onChange={(next) => onChange(next ?? '')}
    />
  );
}
