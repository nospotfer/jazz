const CLASS_NOTE_FILES = [
  'Clase 1_ La Esencia del Jazz - Apuntes.pdf',
  'Clase 2_ El Lenguaje del Jazz_ Heterogeneidad Sonora - Apuntes.pdf',
  'Clase 3_ Gospel y Blues_ Las Raices Profundas - Apuntes.pdf',
  'Clase 4_ Las Formas del Jazz_ Blues y Baladas - Apuntes.pdf',
  'Clase 5_ Un Antecedente Decisivo_ El Ragtime - Apuntes.pdf',
  'Clase 6_ El Ritmo_ El Corazon del Jazz - Apuntes.pdf',
  'Clase 7_ Jamming and Blowing_ El Placer de Improvisar - Apuntes.pdf',
  'Clase 8_ La Composicion Colaborativa_ Ellington, Basie y Monk - Apuntes.pdf',
  'Clase 9_ Instrumentos y Conjuntos (La Orquesta)  - Apuntes.pdf',
  'Clase 10_ Los Pequenos Grupos y el Mundo de los Solistas - Apuntes.pdf',
  'Clase 11_ La Seccion Ritmica_ El Motor del Grupo  - Apuntes.pdf',
  'Clase 12_ La Improvisacion en el Jazz - Apuntes.pdf',
  'Clase 13_ Jazz y Entertainment_ Arte o Espectaculo_ - Apuntes.pdf',
  'Clase 14_ Cantar Jazz (Parte 1)_ De Bessie Smith a Billie Holiday - Apuntes.pdf',
  'Clase 15_ Cantar Jazz (Parte 2)_ De Ella Fitzgerald a Sarah Vaughan - Apuntes.pdf',
];

const AUXILIARY_NOTE_FILES = [
  'Apuntes Auxiliares 1 - Anos relevantes del Periodo Clasico de la Historia del Jazz.pdf',
  'Apuntes Auxiliares 2 - Anos relevantes del Periodo Moderno de la Historia del Jazz.pdf',
];

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

const COURSE_NOTE_KEYS = new Set(
  [...CLASS_NOTE_FILES, ...AUXILIARY_NOTE_FILES].map((fileName) => normalizeCourseNoteKey(fileName))
);

export function getCourseNoteIdentity(url: string, name: string) {
  const normalizedUrl = normalizeCourseNoteKey(url);
  if (COURSE_NOTE_KEYS.has(normalizedUrl)) {
    return normalizedUrl;
  }

  const normalizedName = normalizeCourseNoteKey(name);
  if (COURSE_NOTE_KEYS.has(normalizedName)) {
    return normalizedName;
  }

  return '';
}

export function isCourseNoteAttachment(name: string, url: string) {
  return Boolean(getCourseNoteIdentity(url, name));
}

export function isAuxiliaryCourseNote(name: string, url: string) {
  const identity = getCourseNoteIdentity(url, name);
  return identity.startsWith('apuntes auxiliares');
}

export function getCourseNoteClassNumber(value: string) {
  const decodedValue = decodePdfValue((value || '').trim());
  const match = decodedValue.match(/clase\s*(\d{1,2})/i);
  if (!match) return null;

  const valueAsNumber = Number(match[1]);
  return Number.isInteger(valueAsNumber) ? valueAsNumber : null;
}

export const EXPECTED_COURSE_NOTE_COUNT = COURSE_NOTE_KEYS.size;