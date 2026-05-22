// Multilingual class-note matcher.
// Files in the bucket follow these patterns per language:
//   ES: "Clase <N>_ ... - Apuntes"
//   EN: "Lesson <N>_ ... - Notes"
//   PT: "Aula <N>_ ... - Apontamentos"
//   FR: "Lecon <N>_ ... - Notes"   (also "Leçon" accented)
// Auxiliary notes (2 per language):
//   ES: "Apuntes Auxiliares <N> - ..."
//   EN: "Auxiliary Notes <N> - ..."
//   PT: "Apontamentos Auxiliares <N> - ..."
//   FR: "Notes auxiliaires <N> - ..."
const CLASS_NOTE_PREFIX_REGEX = /^(clase|lesson|aula|le[cç]on)\s+(\d{1,2})[_\s-]/i;
const AUXILIARY_NOTE_PREFIX_REGEX = /^(apuntes auxiliares|auxiliary notes|apontamentos auxiliares|notes auxiliaires)\s+(\d{1,2})\b/i;

function decodePdfValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function normalizeCourseNoteKey(value: string) {
  const rawValue = (value || '').trim();
  if (!rawValue) return '';

  if (!rawValue.startsWith('http')) {
    return decodePdfValue(rawValue)
      .toLowerCase()
      .replace(/^\/+/, '')
      .replace(/\.pdf$/i, '');
  }

  try {
    const url = new URL(rawValue);
    const fileName = decodePdfValue(url.pathname.split('/').pop() || '');
    return fileName.toLowerCase().replace(/\.pdf$/i, '');
  } catch {
    return decodePdfValue(rawValue).toLowerCase().replace(/\.pdf$/i, '');
  }
}

function classifyCourseNoteKey(key: string): 'class' | 'auxiliary' | null {
  if (!key) return null;
  if (AUXILIARY_NOTE_PREFIX_REGEX.test(key)) return 'auxiliary';
  if (CLASS_NOTE_PREFIX_REGEX.test(key)) return 'class';
  return null;
}

export function getCourseNoteIdentity(url: string, name: string) {
  const normalizedUrl = normalizeCourseNoteKey(url);
  if (classifyCourseNoteKey(normalizedUrl)) {
    return normalizedUrl;
  }

  const normalizedName = normalizeCourseNoteKey(name);
  if (classifyCourseNoteKey(normalizedName)) {
    return normalizedName;
  }

  return '';
}

export function isCourseNoteAttachment(name: string, url: string) {
  return Boolean(getCourseNoteIdentity(url, name));
}

export function isAuxiliaryCourseNote(name: string, url: string) {
  const identity = getCourseNoteIdentity(url, name);
  return classifyCourseNoteKey(identity) === 'auxiliary';
}

export function getCourseNoteClassNumber(value: string) {
  const normalized = normalizeCourseNoteKey(value);
  if (!normalized) return null;

  const auxMatch = normalized.match(AUXILIARY_NOTE_PREFIX_REGEX);
  if (auxMatch) {
    const n = Number(auxMatch[2]);
    return Number.isInteger(n) ? n : null;
  }

  const classMatch = normalized.match(CLASS_NOTE_PREFIX_REGEX);
  if (classMatch) {
    const n = Number(classMatch[2]);
    return Number.isInteger(n) ? n : null;
  }

  return null;
}

// 15 class notes + 2 auxiliary notes per language slot. We expose 17 as the
// canonical expected count for a single language; UI uses it as a sanity hint.
export const EXPECTED_COURSE_NOTE_COUNT = 17;