import { createClient } from '@/utils/supabase/server';
import { PromoVideo } from '@/components/landing/promo-video';
import { Header } from '@/components/layout/header';
import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';

const Professor = dynamic(() => import('@/components/landing/professor').then((mod) => mod.Professor));
const WhatYouLearn = dynamic(() => import('@/components/landing/what-you-learn').then((mod) => mod.WhatYouLearn));
const Classes = dynamic(() => import('@/components/landing/classes').then((mod) => mod.Classes));
const Press = dynamic(() => import('@/components/landing/press-gallery').then((mod) => mod.Press));
const JazzCats = dynamic(() => import('@/components/landing/jazz-cats').then((mod) => mod.JazzCats));
const FAQFooter = dynamic(() => import('@/components/landing/faq-footer').then((mod) => mod.FAQFooter));
const BoardNavigation = dynamic(() => import('@/components/landing/board-navigation').then((mod) => mod.BoardNavigation), {
  ssr: false,
});

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <>
      <Header />
      <main className="w-full">
        <section id="board-hero">
          <PromoVideo />
        </section>
        <section id="board-professor">
          <Professor />
        </section>
        <section id="board-learn">
          <WhatYouLearn />
        </section>
        <section id="board-courses">
          <Classes />
        </section>
        <section id="board-press">
          <Press />
        </section>
        <section id="board-jazzcats">
          <JazzCats />
        </section>
        <section id="board-faq">
          <FAQFooter />
        </section>
      </main>
      <BoardNavigation />
    </>
  );
}
