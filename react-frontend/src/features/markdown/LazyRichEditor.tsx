import React, { Suspense } from 'react';
import type { RichEditorProps } from './RichEditor.js';

const RichEditor = React.lazy(() => import('./RichEditor.js'));

export function RichEditorSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`${className} rich-editor-skeleton`} aria-hidden="true">
      <div className="rich-editor-skeleton__line rich-editor-skeleton__line--wide" />
      <div className="rich-editor-skeleton__line" />
      <div className="rich-editor-skeleton__line rich-editor-skeleton__line--short" />
    </div>
  );
}

export default function LazyRichEditor(props: RichEditorProps) {
  return (
    <Suspense fallback={<RichEditorSkeleton className={props.containerClassName} />}>
      <RichEditor {...props} />
    </Suspense>
  );
}
