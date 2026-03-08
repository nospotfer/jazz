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
      <main className="w-full snap-y snap-mandatory">
        <section id="board-hero" className="snap-start scroll-mt-14">
          <PromoVideo />
        </section>
        <section id="board-professor" className="snap-start scroll-mt-14">
          <Professor />
        </section>
        <section id="board-learn" className="snap-start scroll-mt-14">
          <WhatYouLearn />
        </section>
        <section id="board-courses" className="snap-start scroll-mt-14">
          <Classes />
        </section>
        <section id="board-press" className="snap-start scroll-mt-14">
          <Press />
        </section>
        <section id="board-jazzcats" className="snap-start scroll-mt-14">
          <JazzCats />
        </section>
        <section id="board-faq" className="snap-start scroll-mt-14">
          <FAQFooter />
        </section>
      </main>
      <BoardNavigation />
    </>
  );
}
