import { PrismaClient } from '@prisma/client';

const database = new PrismaClient();

async function main() {
  try {
    await database.course.create({
      data: {
        title: 'La Cultura del Jazz',
        description: 'Curso Online con Enric Vazquez Ramonich',
        price: 99.99,
        chapters: {
          create: [
            {
              title: 'Introducción',
              position: 1,
              lessons: {
                create: [
                  {
                    title: 'Introducción a la Cultura del Jazz',
                    position: 1,
                    videoUrl: 'YOUR_MUX_VIDEO_ID',
                    attachments: {
                      create: [
                        {
                          name: 'Lesson PDF',
                          url: '/pdfs/placeholder.pdf',
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              title: 'El Lenguaje del Jazz',
              position: 2,
              lessons: {
                create: [
                  {
                    title: 'La Heterogeneidad Sonora',
                    position: 1,
                    videoUrl: 'YOUR_MUX_VIDEO_ID',
                    attachments: {
                      create: [
                        {
                          name: 'Lesson PDF',
                          url: '/pdfs/placeholder.pdf',
                        },
                      ],
                    },
                  },
                  {
                    title: 'Los Antecedentes',
                    position: 2,
                    videoUrl: 'YOUR_MUX_VIDEO_ID',
                    attachments: {
                      create: [
                        {
                          name: 'Lesson PDF',
                          url: '/pdfs/placeholder.pdf',
                        },
                      ],
                    },
                  },
                  {
                    title: 'La Improvisación',
                    position: 3,
                    videoUrl: 'YOUR_MUX_VIDEO_ID',
                    attachments: {
                      create: [
                        {
                          name: 'Lesson PDF',
                          url: '/pdfs/placeholder.pdf',
                        },
                      ],
                    },
                  },
                  {
                    title: 'El Ritmo',
                    position: 4,
                    videoUrl: 'YOUR_MUX_VIDEO_ID',
                    attachments: {
                      create: [
                        {
                          name: 'Lesson PDF',
                          url: '/pdfs/placeholder.pdf',
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              title: 'Historia Temprana',
              position: 3,
              lessons: {
                create: [
                  {
                    title: 'Un antecedente decisivo: El Ragtime',
                    position: 1,
                    videoUrl: 'YOUR_MUX_VIDEO_ID',
                    attachments: {
                      create: [
                        {
                          name: 'Lesson PDF',
                          url: '/pdfs/placeholder.pdf',
                        },
                      ],
                    },
                  },
                  {
                    title: 'De las Marching Bands a los primeros conjuntos de jazz',
                    position: 2,
                    videoUrl: 'YOUR_MUX_VIDEO_ID',
                    attachments: {
                      create: [
                        {
                          name: 'Lesson PDF',
                          url: '/pdfs/placeholder.pdf',
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              title: 'Estilos y Evolución',
              position: 4,
              lessons: {
                create: [
                  {
                    title: 'Jamming & Blowing',
                    position: 1,
                    videoUrl: 'YOUR_MUX_VIDEO_ID',
                    attachments: {
                      create: [
                        {
                          name: 'Lesson PDF',
                          url: '/pdfs/placeholder.pdf',
                        },
                      ],
                    },
                  },
                  {
                    title: 'Swing y Combos Clásicos',
                    position: 2,
                    videoUrl: 'YOUR_MUX_VIDEO_ID',
                    attachments: {
                      create: [
                        {
                          name: 'Lesson PDF',
                          url: '/pdfs/placeholder.pdf',
                        },
                      ],
                    },
                  },
                  {
                    title: 'Combos modernos e instrumentos',
                    position: 3,
                    videoUrl: 'YOUR_MUX_VIDEO_ID',
                    attachments: {
                      create: [
                        {
                          name: 'Lesson PDF',
                          url: '/pdfs/placeholder.pdf',
                        },
                      ],
                    },
                  },
                  {
                    title: 'Jazz y Entertainment',
                    position: 4,
                    videoUrl: 'YOUR_MUX_VIDEO_ID',
                    attachments: {
                      create: [
                        {
                          name: 'Lesson PDF',
                          url: '/pdfs/placeholder.pdf',
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              title: 'Vocal Jazz',
              position: 5,
              lessons: {
                create: [
                  {
                    title: 'Cantar el Jazz 1',
                    position: 1,
                    videoUrl: 'YOUR_MUX_VIDEO_ID',
                    attachments: {
                      create: [
                        {
                          name: 'Lesson PDF',
                          url: '/pdfs/placeholder.pdf',
                        },
                      ],
                    },
                  },
                  {
                    title: 'Cantar el Jazz 2',
                    position: 2,
                    videoUrl: 'YOUR_MUX_VIDEO_ID',
                    attachments: {
                      create: [
                        {
                          name: 'Lesson PDF',
                          url: '/pdfs/placeholder.pdf',
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });
    console.log('Successfully seeded the database');
  } catch (error) {
    console.error('Error seeding the database:', error);
  } finally {
    await database.$disconnect();
  }
}

main();
