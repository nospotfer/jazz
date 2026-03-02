import { NextResponse } from 'next/server';

// La compra individual de lecciones ya no está disponible.
// El curso se vende como paquete completo.
export async function POST() {
  return new NextResponse(
    'La compra individual de lecciones ya no está disponible. Compra el curso completo.',
    { status: 410 }
  );
}
