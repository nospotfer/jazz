import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';

// This helper is intentionally unable to seed a remote/production environment.
const configPath = process.env.MAINTENANCE_LOCAL_CONFIG;
if (!configPath) throw new Error('Set MAINTENANCE_LOCAL_CONFIG to the disposable local services env file.');
const values = Object.fromEntries((await fs.readFile(configPath, 'utf8')).split(/\r?\n/).filter((line) => line.includes('=')).map((line) => {
  const position = line.indexOf('=');
  return [line.slice(0, position), JSON.parse(line.slice(position + 1))];
}));
const databaseUrl = new URL(values.DB_URL);
const authUrl = new URL(values.API_URL);
if (!['127.0.0.1', 'localhost'].includes(databaseUrl.hostname) || databaseUrl.port !== '56122' || databaseUrl.pathname !== '/postgres' || !['127.0.0.1', 'localhost'].includes(authUrl.hostname) || authUrl.port !== '56121') {
  throw new Error('Refusing to seed anything except the dedicated loopback Supabase maintenance stack.');
}
process.env.DATABASE_URL = values.DB_URL;
const db = new PrismaClient();
const supabase = createClient(values.API_URL, values.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const fixturePath = process.env.MAINTENANCE_FIXTURE_STATE || '/tmp/jazz-maintenance/fixture-users.json';
const courseId = 'maintenance-course';
const chapterId = 'maintenance-chapter';
const bucket = 'maintenance-course-pdfs';
const playbackId = 'TSZoZs4qPde01uwmlonYHcd6rMdpxQLZ3z1UQt7Mmaxg';
let fixture;
try { fixture = JSON.parse(await fs.readFile(fixturePath, 'utf8')); } catch { fixture = { courseId, chapterId, bucket, users: {} }; }

try {
  for (const kind of ['free', 'buyer', 'admin', 'legacy']) {
    if (!fixture.users[kind]) {
      const email = `maintenance-${kind}@example.test`;
      const password = crypto.randomBytes(24).toString('base64url');
      const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: `Maintenance ${kind}` } });
      if (error || !data.user) throw new Error(`Local fixture account creation failed (${kind}).`);
      fixture.users[kind] = { id: data.user.id, email, password };
      await fs.mkdir(path.dirname(fixturePath), { recursive: true, mode: 0o700 });
      await fs.writeFile(fixturePath, JSON.stringify(fixture, null, 2), { mode: 0o600 });
    }
    const user = fixture.users[kind];
    await db.user.upsert({ where: { id: user.id }, update: {}, create: { id: user.id, email: user.email, name: `Maintenance ${kind}`, emailVerified: true, role: kind === 'admin' ? 'SUPER_ADMIN' : 'USER' } });
  }

  await db.course.upsert({ where: { id: courseId }, update: {}, create: { id: courseId, title: 'La Cultura del Jazz', description: 'Isolated maintenance course fixtures', price: 80, imageUrl: '/images/clase1.jpg', isPublished: true } });
  await db.chapter.upsert({ where: { id: chapterId }, update: {}, create: { id: chapterId, courseId, title: 'Cultura del Jazz', position: 0, isPublished: true } });
  const { data: buckets, error: bucketReadError } = await supabase.storage.listBuckets();
  if (bucketReadError) throw new Error('Local bucket inspection failed.');
  if (!buckets.some((item) => item.id === bucket)) {
    const { error } = await supabase.storage.createBucket(bucket, { public: false });
    if (error) throw new Error('Local private bucket creation failed.');
  }

  for (let number = 1; number <= 15; number += 1) {
    const lessonId = `maintenance-lesson-${number}`;
    await db.lesson.upsert({ where: { id: lessonId }, update: {}, create: { id: lessonId, chapterId, title: `Clase ${number}`, description: 'Isolated fixture lesson', position: number - 1, videoUrl: playbackId, isPublished: true } });
    for (const language of ['es', 'en', 'fr', 'pt']) {
      const prefix = { es: 'Clase', en: 'Lesson', fr: 'Lecon', pt: 'Aula' }[language];
      const filename = `${prefix} ${number}_ Maintenance notes.pdf`;
      const storagePath = `${language}/${filename}`;
      const pdf = new jsPDF();
      pdf.text(`Jazz maintenance - lesson ${number} (${language})`, 20, 25);
      pdf.text('Disposable fixture document; contains no customer information.', 20, 40);
      const bytes = new Uint8Array(pdf.output('arraybuffer'));
      const { error } = await supabase.storage.from(bucket).upload(storagePath, bytes, { contentType: 'application/pdf', upsert: true });
      if (error) throw new Error('Local fixture PDF upload failed.');
      await db.attachment.upsert({ where: { lessonId_language_documentKey: { lessonId, language, documentKey: 'class-note' } }, update: {}, create: { id: `maintenance-pdf-${number}-${language}`, lessonId, language, documentKey: 'class-note', name: filename, url: storagePath, kind: 'CLASS' } });
    }
    for (let question = 1; question <= 12; question += 1) {
      const questionId = `maintenance-question-${number}-${question}`;
      await db.lessonQuizQuestion.upsert({ where: { id: questionId }, update: {}, create: { id: questionId, lessonId, prompt: `Maintenance question ${question}: Which statement describes jazz?`, explanation: 'Jazz includes improvisation.', isActive: true } });
      for (let position = 0; position < 5; position += 1) {
        await db.lessonQuizOption.upsert({ where: { questionId_position: { questionId, position } }, update: {}, create: { id: `${questionId}-option-${position}`, questionId, position, label: String.fromCharCode(65 + position), text: position === 0 ? 'It includes improvisation.' : `Fixture alternative ${position}`, isCorrect: position === 0 } });
      }
    }
  }
  await db.purchase.upsert({ where: { userId_courseId: { userId: fixture.users.buyer.id, courseId } }, update: {}, create: { userId: fixture.users.buyer.id, courseId, providerReferenceId: 'maintenance-fixture-paid', originalPrice: 80, finalPrice: 80, discountAmount: 0 } });
  await db.lessonPurchase.upsert({ where: { userId_lessonId: { userId: fixture.users.legacy.id, lessonId: 'maintenance-lesson-2' } }, update: {}, create: { userId: fixture.users.legacy.id, lessonId: 'maintenance-lesson-2' } });
  await fs.writeFile(fixturePath, JSON.stringify(fixture, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ seeded: true, courses: 1, lessons: 15, pdfs: 60, quizQuestions: 180, userRoles: Object.keys(fixture.users), privateFixtureState: fixturePath }));
} finally {
  await db.$disconnect();
}
