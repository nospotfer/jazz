'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bold, FileText, Italic, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LessonNotesEditorProps {
  courseId: string;
  lessonId: string;
  classLabel: string;
  lessonTitle: string;
}

interface NotesStyleState {
  isBold: boolean;
  isItalic: boolean;
  fontSize: number;
}

const MIN_FONT_SIZE = 11;
const MAX_FONT_SIZE = 14;

export function LessonNotesEditor({
  courseId,
  lessonId,
  classLabel,
  lessonTitle,
}: LessonNotesEditorProps) {
  const notesStorageKey = useMemo(
    () => `lesson-notes:${courseId}:${lessonId}`,
    [courseId, lessonId]
  );

  const styleStorageKey = useMemo(
    () => `lesson-notes-style:${courseId}:${lessonId}`,
    [courseId, lessonId]
  );

  const [content, setContent] = useState('');
  const [styleState, setStyleState] = useState<NotesStyleState>({
    isBold: false,
    isItalic: false,
    fontSize: 13,
  });

  useEffect(() => {
    const savedNotes = window.localStorage.getItem(notesStorageKey) || '';
    setContent(savedNotes);

    const rawStyle = window.localStorage.getItem(styleStorageKey);
    if (!rawStyle) return;

    try {
      const parsed = JSON.parse(rawStyle) as Partial<NotesStyleState>;
      setStyleState({
        isBold: Boolean(parsed.isBold),
        isItalic: Boolean(parsed.isItalic),
        fontSize:
          typeof parsed.fontSize === 'number'
            ? Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, parsed.fontSize))
            : 13,
      });
    } catch {
      setStyleState({
        isBold: false,
        isItalic: false,
        fontSize: 13,
      });
    }
  }, [notesStorageKey, styleStorageKey]);

  const persistStyle = (next: NotesStyleState) => {
    setStyleState(next);
    window.localStorage.setItem(styleStorageKey, JSON.stringify(next));
  };

  const handleFontChange = (delta: number) => {
    const nextSize = Math.max(
      MIN_FONT_SIZE,
      Math.min(MAX_FONT_SIZE, styleState.fontSize + delta)
    );
    persistStyle({ ...styleState, fontSize: nextSize });
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">My Notes</h1>
        <p className="text-muted-foreground mt-1">
          {classLabel}: {lessonTitle}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_170px] gap-4">
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2 border border-border rounded-lg p-2 bg-background">
            <Button
              type="button"
              variant={styleState.isBold ? 'default' : 'outline'}
              onClick={() => persistStyle({ ...styleState, isBold: !styleState.isBold })}
              className="h-9 px-3"
              title="Bold"
              aria-label="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant={styleState.isItalic ? 'default' : 'outline'}
              onClick={() => persistStyle({ ...styleState, isItalic: !styleState.isItalic })}
              className="h-9 px-3"
              title="Italic"
              aria-label="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleFontChange(-1)}
              disabled={styleState.fontSize <= MIN_FONT_SIZE}
              className="h-9 px-3"
              title="Decrease font"
              aria-label="Decrease font"
            >
              <Minus className="h-4 w-4" />
            </Button>

            <span className="text-sm text-muted-foreground min-w-14 text-center">
              {styleState.fontSize}px
            </span>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleFontChange(1)}
              disabled={styleState.fontSize >= MAX_FONT_SIZE}
              className="h-9 px-3"
              title="Increase font"
              aria-label="Increase font"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <textarea
            value={content}
            onChange={(event) => {
              const nextValue = event.target.value;
              setContent(nextValue);
              window.localStorage.setItem(notesStorageKey, nextValue);
            }}
            placeholder="DIGITE AQUI"
            className="w-full min-h-[420px] resize-y rounded-lg border-2 border-border bg-background p-4 sm:p-5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50"
            style={{
              fontWeight: styleState.isBold ? 700 : 400,
              fontStyle: styleState.isItalic ? 'italic' : 'normal',
              fontSize: `${styleState.fontSize}px`,
              lineHeight: 1.6,
            }}
          />
        </div>

        <aside className="bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center text-center min-h-[220px]">
          <FileText className="h-10 w-10 text-primary mb-3" />
          <p className="text-sm font-medium text-foreground">PDF</p>
          <p className="text-xs text-muted-foreground mt-1">Placeholder</p>
        </aside>
      </div>
    </div>
  );
}
