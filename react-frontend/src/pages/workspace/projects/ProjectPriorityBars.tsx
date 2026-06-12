import { PROJECT_PRIORITY_META } from '@/entities/project/model/projectMeta.js';
import type { ProjectPriority } from '@/types/dto.js';

export function ProjectPriorityBars({ priority, showLabel = false }: { priority: ProjectPriority; showLabel?: boolean }) {
  const meta = PROJECT_PRIORITY_META[priority] ?? PROJECT_PRIORITY_META.none;
  const displayLabel = priority === 'none' ? 'None' : meta.label;

  if (showLabel) {
    return (
      <>
        <span className="sx-dot" />
        <span>{displayLabel}</span>
      </>
    );
  }

  return (
    <span
      className="project-priority-dot"
      title={meta.label}
      style={{ color: meta.color }}
    >
      <span className="sx-dot" />
      <span className="sr-only">{displayLabel}</span>
    </span>
  );
}
