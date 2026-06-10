import { PROJECT_PRIORITY_META } from '@/entities/project/model/projectMeta.js';
import type { ProjectPriority } from '@/types/dto.js';

export function ProjectPriorityBars({ priority, showLabel = false }: { priority: ProjectPriority; showLabel?: boolean }) {
  const meta = PROJECT_PRIORITY_META[priority] ?? PROJECT_PRIORITY_META.none;
  const displayLabel = priority === 'none' ? 'None' : meta.label;

  return (
    <span
      className={`project-priority${showLabel ? ' project-priority--with-label' : ''}`}
      title={meta.label}
      style={{ ['--priority-color' as string]: meta.color }}
    >
      <span className="project-priority__bars" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, idx) => (
          <span
            key={idx}
            className="project-priority__bar"
            data-active={idx < meta.bars}
          />
        ))}
      </span>
      <span className={showLabel ? 'project-priority__label' : 'sr-only'}>{displayLabel}</span>
    </span>
  );
}
