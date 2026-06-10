import { ArrowLeft, Trash2 } from 'lucide-react';

interface TaskDetailNavProps {
  canDelete: boolean;
  onBack: () => void;
  onDelete: () => void;
}

export function TaskDetailNav({ canDelete, onBack, onDelete }: TaskDetailNavProps) {
  return (
    <div className="task-detail-nav">
      <button
        onClick={onBack}
        className="task-back-button"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="task-delete-button"
        >
          <Trash2 size={14} />
          Delete
        </button>
      )}
    </div>
  );
}
