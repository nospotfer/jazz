import { PromoVideo } from '@/components/landing/promo-video';
import { Professor } from '@/components/landing/professor';
import { WhatYouLearn } from '@/components/landing/what-you-learn';
import { Classes } from '@/components/landing/classes';
import { Press } from '@/components/landing/press-gallery';
import { JazzCats } from '@/components/landing/jazz-cats';
import { FAQs } from '@/components/landing/faqs';
import { FinalCTA } from '@/components/landing/final-cta';
import { Footer } from '@/components/landing/footer';
import { Header } from '@/components/layout/header';

export default function Home() {
  return (
    <>
      <Header />
      <main className="w-full">
        <PromoVideo />
        <Professor />
        <WhatYouLearn />
        <Classes />
        <Press />
        <JazzCats />
        <FAQs />
        <FinalCTA />
        <Footer />
      </main>
    </>
  );
}
