import type { ChangeEvent, RefObject } from 'react';
import type { TaskDTO } from '@/types/dto.js';
import { TaskDescriptionEditor } from './TaskDescriptionEditor.js';
import { TaskSubtasks } from './TaskSubtasks.js';

interface TaskDetailMainProps {
  draft: TaskDTO;
  workspaceName: string;
  titleRef: RefObject<HTMLTextAreaElement | null>;
  editable: boolean;
  isNew: boolean;
  saving: boolean;
  workspaceId: string | null;
  onTitleChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onDescriptionChange: (value: string) => void;
  onCreate: () => void;
  onCancel: () => void;
}

export function TaskDetailMain({
  draft,
  workspaceName,
  titleRef,
  editable,
  isNew,
  saving,
  workspaceId,
  onTitleChange,
  onDescriptionChange,
  onCreate,
  onCancel,
}: TaskDetailMainProps) {
  return (
    <main className="task-detail-main">
      <section className="task-detail-hero">
        <div className="task-detail-meta">
          <span>{draft.key || 'New task'}</span>
          <span />
          <span>{workspaceName}</span>
        </div>

        <textarea
          ref={titleRef}
          value={draft.task}
          onChange={onTitleChange}
          disabled={!editable}
          rows={2}
          placeholder="Task title"
          className="task-title-input"
        />
      </section>

      <TaskDescriptionEditor
        description={draft.description}
        editable={editable}
        onChange={onDescriptionChange}
      />

      {!isNew && <TaskSubtasks subtasks={draft.subtasks ?? []} />}

      {isNew && (
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-label-sm text-[color:var(--sx-text-muted)] hover:text-[color:var(--sx-text)] transition-colors">
            Cancel
          </button>
          <button
            onClick={onCreate}
            disabled={saving || !draft.task.trim() || !workspaceId}
            className="liquid-button px-5 py-2 text-label-sm disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create task'}
          </button>
        </div>
      )}
    </main>
  );
}
