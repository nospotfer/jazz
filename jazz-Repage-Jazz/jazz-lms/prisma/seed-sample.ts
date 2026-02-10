#!/usr/bin/env ts-node

/**
 * Seed script to add sample course data to the database
 * Run with: npm run seed:sample
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding sample data...');

  // Create a sample course
  const course = await prisma.course.upsert({
    where: { id: '550e8400-e29b-41d4-a716-446655440001' },
    update: {},
    create: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Introduction to Jazz Music',
      description:
        'Discover the fundamentals of jazz music, from its rich history to essential theory. Perfect for beginners and enthusiasts looking to deepen their understanding of this iconic genre.',
      imageUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800',
      price: 49.99,
      isPublished: true,
    },
  });

  console.log('✅ Created course:', course.title);

  // Create chapters
  const chapters = await Promise.all([
    prisma.chapter.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440002' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440002',
        title: 'Chapter 1: Jazz Foundations',
        description: 'Learn the basics of jazz music and its historical roots',
        position: 1,
        isPublished: true,
        courseId: course.id,
      },
    }),
    prisma.chapter.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440003' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440003',
        title: 'Chapter 2: Jazz Theory',
        description: 'Understanding scales, chords, and improvisation',
        position: 2,
        isPublished: true,
        courseId: course.id,
      },
    }),
    prisma.chapter.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440004' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440004',
        title: 'Chapter 3: Great Jazz Artists',
        description: 'Explore the legends who shaped jazz music',
        position: 3,
        isPublished: true,
        courseId: course.id,
      },
    }),
  ]);

  console.log('✅ Created', chapters.length, 'chapters');

  // Create lessons for Chapter 1
  const chapter1Lessons = await Promise.all([
    prisma.lesson.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440005' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440005',
        title: 'What is Jazz?',
        description: 'An introduction to jazz music and its characteristics',
        position: 1,
        isPublished: true,
        chapterId: chapters[0].id,
      },
    }),
    prisma.lesson.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440006' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440006',
        title: 'History of Jazz',
        description: 'From New Orleans to the world - the evolution of jazz',
        position: 2,
        isPublished: true,
        chapterId: chapters[0].id,
      },
    }),
    prisma.lesson.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440007' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440007',
        title: 'Basic Jazz Elements',
        description: 'Understanding swing, syncopation, and improvisation',
        position: 3,
        isPublished: true,
        chapterId: chapters[0].id,
      },
    }),
  ]);

  // Create lessons for Chapter 2
  const chapter2Lessons = await Promise.all([
    prisma.lesson.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440008' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440008',
        title: 'Jazz Scales',
        description: 'Learn the essential scales used in jazz music',
        position: 1,
        isPublished: true,
        chapterId: chapters[1].id,
      },
    }),
    prisma.lesson.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440009' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440009',
        title: 'Jazz Chords',
        description: 'Understanding jazz chord progressions and voicings',
        position: 2,
        isPublished: true,
        chapterId: chapters[1].id,
      },
    }),
    prisma.lesson.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440010' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440010',
        title: 'Introduction to Improvisation',
        description: 'Basic techniques for improvising over jazz standards',
        position: 3,
        isPublished: true,
        chapterId: chapters[1].id,
      },
    }),
  ]);

  // Create lessons for Chapter 3
  const chapter3Lessons = await Promise.all([
    prisma.lesson.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440011' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440011',
        title: 'Louis Armstrong',
        description: 'The legendary trumpeter and vocalist who shaped early jazz',
        position: 1,
        isPublished: true,
        chapterId: chapters[2].id,
      },
    }),
    prisma.lesson.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440012' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440012',
        title: 'Duke Ellington',
        description: 'The composer and bandleader who elevated jazz to an art form',
        position: 2,
        isPublished: true,
        chapterId: chapters[2].id,
      },
    }),
    prisma.lesson.upsert({
      where: { id: '550e8400-e29b-41d4-a716-446655440013' },
      update: {},
      create: {
        id: '550e8400-e29b-41d4-a716-446655440013',
        title: 'Miles Davis',
        description: 'The innovative trumpeter who revolutionized jazz multiple times',
        position: 3,
        isPublished: true,
        chapterId: chapters[2].id,
      },
    }),
  ]);

  const totalLessons =
    chapter1Lessons.length + chapter2Lessons.length + chapter3Lessons.length;

  console.log('✅ Created', totalLessons, 'lessons');
  console.log('\n🎉 Sample data seeding complete!');
  console.log('\n📊 Summary:');
  console.log(`  - 1 course: "${course.title}"`);
  console.log(`  - ${chapters.length} chapters`);
  console.log(`  - ${totalLessons} lessons`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

