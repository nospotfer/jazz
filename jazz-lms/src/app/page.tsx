import { PromoVideo } from '@/components/landing/promo-video';
import { Professor } from '@/components/landing/professor';
import { WhatYouLearn } from '@/components/landing/what-you-learn';
import { Classes } from '@/components/landing/classes';
import { Press } from '@/components/landing/press-gallery';
import { JazzCats } from '@/components/landing/jazz-cats';
import { FAQFooter } from '@/components/landing/faq-footer';
import { Header } from '@/components/layout/header';
import { BoardNavigation } from '@/components/landing/board-navigation';

export default function Home() {
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
