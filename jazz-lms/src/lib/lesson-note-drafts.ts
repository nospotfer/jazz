export interface LessonNoteStyle {
  isBold: boolean;
  isItalic: boolean;
  fontSize: number;
}

export const DEFAULT_NOTE_STYLE: LessonNoteStyle = { isBold: false, isItalic: false, fontSize: 13 };
export const MIN_NOTE_FONT_SIZE = 11;
export const MAX_NOTE_FONT_SIZE = 14;

export function normalizeNoteStyle(value: Partial<LessonNoteStyle> | null | undefined): LessonNoteStyle {
  return {
    isBold: value?.isBold === true,
    isItalic: value?.isItalic === true,
    fontSize: typeof value?.fontSize === 'number' && Number.isFinite(value.fontSize)
      ? Math.max(MIN_NOTE_FONT_SIZE, Math.min(MAX_NOTE_FONT_SIZE, Math.floor(value.fontSize)))
      : DEFAULT_NOTE_STYLE.fontSize,
  };
}

export function lessonNoteDraftKeys(userId: string, courseId: string, lessonId: string) {
  const scope = [userId, courseId, lessonId].map(encodeURIComponent).join(':');
  return { content: `lesson-notes:v2:${scope}`, style: `lesson-notes-style:v2:${scope}`, state: `lesson-notes-state:v2:${scope}`, acknowledgement: `lesson-notes-ack:v2:${scope}` };
}

interface DraftRecord {
  content: string;
  style: LessonNoteStyle;
  isDirty: boolean;
  revision: string;
}

function readRecord(local: Storage | null, key: string): DraftRecord | null {
  try {
    const raw = local?.getItem(key);
    const record = raw ? JSON.parse(raw) : null;
    if (record && typeof record.content === 'string' && typeof record.isDirty === 'boolean' &&
      typeof record.revision === 'string' && record.revision) {
      return { ...record, style: normalizeNoteStyle(record.style) };
    }
  } catch { /* Ignore unavailable storage or malformed owned records. */ }
  return null;
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readLessonNoteDraft(userId: string, courseId: string, lessonId: string) {
  const local = storage();
  const keys = lessonNoteDraftKeys(userId, courseId, lessonId);
  // These old keys have no provable owner. Never copy their plaintext into a new account.
  for (const key of [`lesson-notes:${courseId}:${lessonId}`, `lesson-notes-style:${courseId}:${lessonId}`]) {
    try { local?.removeItem(key); } catch { /* Storage can be unavailable. */ }
  }
  const record = readRecord(local, keys.state);
  if (record) {
    let acknowledged = false;
    try { acknowledged = local?.getItem(keys.acknowledgement) === record.revision; } catch { /* Keep unknown acknowledgement dirty. */ }
    return { ...record, isDirty: record.isDirty && !acknowledged };
  }
  let content = '';
  let style = DEFAULT_NOTE_STYLE;
  let hasOwnedDraft = false;
  try {
    const saved = local?.getItem(keys.content);
    content = saved ?? '';
    hasOwnedDraft = saved !== null && saved !== undefined;
  } catch { /* Server notes still work. */ }
  try {
    const raw = local?.getItem(keys.style);
    if (raw) style = normalizeNoteStyle(JSON.parse(raw));
  } catch { /* Ignore unavailable storage or malformed draft styles. */ }
  // An owned, unmarked draft has not been acknowledged. Preserve it for an
  // explicit save; this never migrates an unowned legacy key.
  return { content, style, isDirty: hasOwnedDraft, revision: null };
}

export function writeLessonNoteDraft(userId: string, courseId: string, lessonId: string, content: string, style?: LessonNoteStyle, options: { isDirty?: boolean } = {}) {
  const local = storage();
  const keys = lessonNoteDraftKeys(userId, courseId, lessonId);
  const revision = crypto.randomUUID();
  const record: DraftRecord = { content, style: style ?? readLessonNoteDraft(userId, courseId, lessonId).style, isDirty: options.isDirty ?? true, revision };
  try {
    // The state record keeps the snapshot and its dirty marker atomic. The two
    // original v2 keys remain mirrors; a failed mirror write cannot lose it.
    local?.setItem(keys.state, JSON.stringify(record));
  } catch { return revision; /* Visible edits and server saving still work. */ }
  try { local?.setItem(keys.content, content); } catch { /* The state record remains authoritative. */ }
  try { local?.setItem(keys.style, JSON.stringify(record.style)); } catch { /* The state record remains authoritative. */ }
  return revision;
}

export function acknowledgeLessonNoteDraft(userId: string, courseId: string, lessonId: string, revision: string) {
  const local = storage();
  const keys = lessonNoteDraftKeys(userId, courseId, lessonId);
  const record = readRecord(local, keys.state);
  if (!record || record.revision !== revision) return;
  // A receipt never rewrites the draft snapshot. Even a concurrent tab writing
  // a newer revision between this check and setItem cannot have it marked clean.
  try { local?.setItem(keys.acknowledgement, revision); } catch { /* Retain the draft if acknowledgement cannot be persisted. */ }
}
