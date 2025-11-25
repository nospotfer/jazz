-- Sample Data for Jazz LMS
-- Run this in Supabase SQL Editor to add a sample course

-- Insert a sample course
INSERT INTO "Course" ("id", "title", "description", "imageUrl", "price", "isPublished")
VALUES
    (
        '550e8400-e29b-41d4-a716-446655440001',
        'Introduction to Jazz Music',
        'Discover the fundamentals of jazz music, from its rich history to essential theory. Perfect for beginners and enthusiasts looking to deepen their understanding of this iconic genre.',
        'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800',
        49.99,
        true
    )
ON CONFLICT ("id") DO NOTHING;

-- Insert chapters for the course
INSERT INTO "Chapter" ("id", "title", "description", "position", "isPublished", "courseId")
VALUES
    (
        '550e8400-e29b-41d4-a716-446655440002',
        'Chapter 1: Jazz Foundations',
        'Learn the basics of jazz music and its historical roots',
        1,
        true,
        '550e8400-e29b-41d4-a716-446655440001'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440003',
        'Chapter 2: Jazz Theory',
        'Understanding scales, chords, and improvisation',
        2,
        true,
        '550e8400-e29b-41d4-a716-446655440001'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440004',
        'Chapter 3: Great Jazz Artists',
        'Explore the legends who shaped jazz music',
        3,
        true,
        '550e8400-e29b-41d4-a716-446655440001'
    )
ON CONFLICT ("id") DO NOTHING;

-- Insert lessons for Chapter 1
INSERT INTO "Lesson" ("id", "title", "description", "videoUrl", "position", "isPublished", "chapterId")
VALUES
    (
        '550e8400-e29b-41d4-a716-446655440005',
        'What is Jazz?',
        'An introduction to jazz music and its characteristics',
        NULL,
        1,
        true,
        '550e8400-e29b-41d4-a716-446655440002'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440006',
        'History of Jazz',
        'From New Orleans to the world - the evolution of jazz',
        NULL,
        2,
        true,
        '550e8400-e29b-41d4-a716-446655440002'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440007',
        'Basic Jazz Elements',
        'Understanding swing, syncopation, and improvisation',
        NULL,
        3,
        true,
        '550e8400-e29b-41d4-a716-446655440002'
    )
ON CONFLICT ("id") DO NOTHING;

-- Insert lessons for Chapter 2
INSERT INTO "Lesson" ("id", "title", "description", "videoUrl", "position", "isPublished", "chapterId")
VALUES
    (
        '550e8400-e29b-41d4-a716-446655440008',
        'Jazz Scales',
        'Learn the essential scales used in jazz music',
        NULL,
        1,
        true,
        '550e8400-e29b-41d4-a716-446655440003'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440009',
        'Jazz Chords',
        'Understanding jazz chord progressions and voicings',
        NULL,
        2,
        true,
        '550e8400-e29b-41d4-a716-446655440003'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440010',
        'Introduction to Improvisation',
        'Basic techniques for improvising over jazz standards',
        NULL,
        3,
        true,
        '550e8400-e29b-41d4-a716-446655440003'
    )
ON CONFLICT ("id") DO NOTHING;

-- Insert lessons for Chapter 3
INSERT INTO "Lesson" ("id", "title", "description", "videoUrl", "position", "isPublished", "chapterId")
VALUES
    (
        '550e8400-e29b-41d4-a716-446655440011',
        'Louis Armstrong',
        'The legendary trumpeter and vocalist who shaped early jazz',
        NULL,
        1,
        true,
        '550e8400-e29b-41d4-a716-446655440004'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440012',
        'Duke Ellington',
        'The composer and bandleader who elevated jazz to an art form',
        NULL,
        2,
        true,
        '550e8400-e29b-41d4-a716-446655440004'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440013',
        'Miles Davis',
        'The innovative trumpeter who revolutionized jazz multiple times',
        NULL,
        3,
        true,
        '550e8400-e29b-41d4-a716-446655440004'
    )
ON CONFLICT ("id") DO NOTHING;

-- Verify the data was inserted
SELECT
    c.title as course,
    ch.title as chapter,
    COUNT(l.id) as lesson_count
FROM "Course" c
LEFT JOIN "Chapter" ch ON ch."courseId" = c.id
LEFT JOIN "Lesson" l ON l."chapterId" = ch.id
GROUP BY c.id, c.title, ch.id, ch.title
ORDER BY c.title, ch.position;

