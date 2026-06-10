import { Check } from 'lucide-react';
import type { SubtaskDTO } from '@/types/dto.js';

interface TaskSubtasksProps {
  subtasks: SubtaskDTO[];
}

export function TaskSubtasks({ subtasks }: TaskSubtasksProps) {
  if (subtasks.length === 0) return null;

  return (
    <section className="task-subtasks-panel">
      <h2>Subtasks</h2>
      <div className="flex flex-col gap-2">
        {subtasks.map((subtask) => (
          <div key={subtask.id} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${subtask.is_done ? 'bg-emerald-500/30 border-emerald-500/50' : 'border-[color:var(--sx-border)]'}`}>
              {subtask.is_done && <Check size={10} className="text-emerald-300" />}
            </div>
            <span className={`text-body-sm ${subtask.is_done ? 'line-through text-[color:var(--sx-text-subtle)]' : 'text-[color:var(--sx-text)]'}`}>
              {subtask.title}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
