import { BoardNavigation } from "@/components/landing/board-navigation";
import { PromoVideo } from "@/components/landing/promo-video";
import { Header } from "@/components/layout/header";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";
import { isPublicIndexingEnabled, publicHomeMetadata } from "@/lib/seo";

function SectionLoadingFallback() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="h-52 w-full animate-pulse rounded-xl border border-border bg-card/60" />
    </div>
  );
}

const Professor = dynamic(
  () => import("@/components/landing/professor").then((mod) => mod.Professor),
  {
    loading: () => <SectionLoadingFallback />,
  },
);
const WhatYouLearn = dynamic(
  () =>
    import("@/components/landing/what-you-learn").then(
      (mod) => mod.WhatYouLearn,
    ),
  {
    loading: () => <SectionLoadingFallback />,
  },
);
const Classes = dynamic(
  () => import("@/components/landing/classes").then((mod) => mod.Classes),
  {
    loading: () => <SectionLoadingFallback />,
  },
);
const Press = dynamic(
  () => import("@/components/landing/press-gallery").then((mod) => mod.Press),
  {
    loading: () => <SectionLoadingFallback />,
  },
);
const JazzCats = dynamic(
  () => import("@/components/landing/jazz-cats").then((mod) => mod.JazzCats),
  {
    loading: () => <SectionLoadingFallback />,
  },
);
const FAQFooter = dynamic(
  () => import("@/components/landing/faq-footer").then((mod) => mod.FAQFooter),
  {
    loading: () => <SectionLoadingFallback />,
  },
);

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ searchParams }: HomePageProps) {
  const parameters = await searchParams;
  return publicHomeMetadata(isPublicIndexingEnabled() && Object.keys(parameters).length === 0);
}

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = await searchParams;
  const oauthCode =
    typeof resolvedSearchParams.code === "string"
      ? resolvedSearchParams.code
      : null;

  // Fallback for providers that return to the site root with OAuth query params.
  // We forward everything to the callback route that exchanges code -> session.
  if (oauthCode) {
    const callbackSearchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(resolvedSearchParams)) {
      if (typeof value === "string") {
        callbackSearchParams.append(key, value);
        continue;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => callbackSearchParams.append(key, item));
      }
    }

    redirect(`/auth/callback?${callbackSearchParams.toString()}`);
  }

  return (
    <>
      <Header authMode="guest" />
      <main className="w-full">
        <section id="board-hero" className="scroll-mt-32 xl:scroll-mt-20">
          <PromoVideo />
        </section>
        <section id="board-professor" className="scroll-mt-32 xl:scroll-mt-20">
          <Professor />
        </section>
        <section id="board-learn" className="scroll-mt-32 xl:scroll-mt-20">
          <WhatYouLearn />
        </section>
        <section id="board-courses" className="scroll-mt-32 xl:scroll-mt-20">
          <Classes />
        </section>
        <section id="board-press" className="scroll-mt-32 xl:scroll-mt-20">
          <Press />
        </section>
        <section id="board-jazzcats" className="scroll-mt-32 xl:scroll-mt-20">
          <JazzCats />
        </section>
        <section id="board-faq" className="scroll-mt-32 xl:scroll-mt-20">
          <FAQFooter />
        </section>
      </main>
      <BoardNavigation />
    </>
  );
}
