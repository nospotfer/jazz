import { PromoVideo } from '@/components/landing/promo-video';
import { CourseIntro } from '@/components/landing/course-intro';
import { Classes } from '@/components/landing/classes';
import { Press } from '@/components/landing/press-gallery';
import { JazzCats } from '@/components/landing/jazz-cats';
import { FAQs } from '@/components/landing/faqs';
import { FinalCTA } from '@/components/landing/final-cta';
import { Footer } from '@/components/landing/footer';

export default function Home() {
  return (
    <main className="w-full">
      <PromoVideo />
      <CourseIntro />
      <Classes />
      <Press />
      <JazzCats />
      <FAQs />
      <FinalCTA />
      <Footer />
    </main>
  );
}
