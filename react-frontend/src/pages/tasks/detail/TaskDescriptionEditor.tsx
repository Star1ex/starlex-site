import RichEditor from '@/features/markdown/LazyRichEditor.js';

interface TaskDescriptionEditorProps {
  description: string;
  editable: boolean;
  onChange: (value: string) => void;
}

export function TaskDescriptionEditor({
  description,
  editable,
  onChange,
}: TaskDescriptionEditorProps) {
  return (
    <section className="task-description-panel">
      <div className="task-description-head">
        <div>
          <h2>Description</h2>
          <p>Write the task context, checklist, notes, or links.</p>
        </div>
      </div>
      <div className="task-description-body">
        {editable ? (
          <RichEditor
            value={description}
            onChange={onChange}
            placeholder="Add a description..."
            containerClassName="task-description-editor"
          />
        ) : (
          <div className="task-description-readonly">
            {description || <span className="text-[color:var(--sx-text-subtle)]">No description</span>}
          </div>
        )}
      </div>
    </section>
  );
}
