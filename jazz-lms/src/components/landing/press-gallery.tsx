"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import type { PressContent } from "@/content/landing/press-content";
import type { SupportedLanguage } from "@/lib/language";
import { FileText, Newspaper, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type PressType = "article" | "guide";

type PressItem = {
  id: string;
  type: PressType;
  title: string;
  author: string;
  publication: string;
  date: string;
  image: string;
  excerpt: Record<SupportedLanguage, string>;
};

const pressItems: PressItem[] = [
  {
    id: "circulo-liceo",
    type: "article",
    title: "Ponente en el Círculo del Liceo",
    author: "E. Llinás",
    publication: "La Vanguardia",
    date: "4/05/2022",
    image: "/images/en la prensa1.jpeg",
    excerpt: {
      es: "Reconocimiento de su papel como figura articuladora entre historia, divulgación y vida cultural del jazz en la ciudad.",
      en: "Recognition of his role as a key bridge between jazz history, public outreach, and cultural education in the city.",
      fr: "Reconnaissance de son rôle de trait d’union entre mémoire du jazz, diffusion culturelle et transmission.",
      pt: "Reconhecimento do seu papel como elo entre memória do jazz, divulgação cultural e formação de público.",
    },
  },
  {
    id: "jamboree",
    type: "article",
    title: "Jamboree",
    author: "J. Sagarra",
    publication: "La Vanguardia",
    date: "19/01/2020",
    image: "/images/en la prensa2.jpeg",
    excerpt: {
      es: "Referencia histórica que relaciona a Enric Vázquez con el núcleo fundacional de la escena moderna del jazz en Barcelona.",
      en: "A historical reference linking Enric Vázquez to the formative core of Barcelona’s modern jazz ecosystem.",
      fr: "Référence historique reliant Enric Vázquez au noyau fondateur de la scène jazz moderne de Barcelone.",
      pt: "Referência histórica que liga Enric Vázquez ao núcleo formador da cena moderna de jazz em Barcelona.",
    },
  },
  {
    id: "guide-101",
    type: "guide",
    title: "Iwanowski Guide 101 Barcelona",
    author: "K. Sommer",
    publication: "Iwanowski Guide 101 Barcelona",
    date: "2023, p. 207",
    image: "/images/en la prensa3.jpeg",
    excerpt: {
      es: "Bloque editorial bibliográfico que amplía el reconocimiento más allá de la prensa local y lo proyecta en una guía cultural internacional.",
      en: "A bibliographic editorial block that extends recognition beyond local press and into an international cultural guide context.",
      fr: "Bloc éditorial bibliographique qui élargit la reconnaissance au-delà de la presse locale vers un cadre culturel international.",
      pt: "Bloco editorial bibliográfico que amplia o reconhecimento para além da imprensa local e o posiciona em guia cultural internacional.",
    },
  },
];

const uiText: Record<
  SupportedLanguage,
  {
    sectionTitle: string;
    openContext: string;
    sourceLabel: string;
    summaryLabel: string;
    contextLabel: string;
    relevanceLabel: string;
    noteLabel: string;
    quoteLabel: string;
    articleTag: string;
    guideTag: string;
    closeLabel: string;
    loadingLabel: string;
  }
> = {
  es: {
    sectionTitle: "En la prensa",
    openContext: "Ver contexto",
    sourceLabel: "Fuente",
    summaryLabel: "Resumen editorial",
    contextLabel: "Contexto",
    relevanceLabel: "Por qué importa",
    noteLabel: "Nota editorial",
    quoteLabel: "Cita destacada",
    articleTag: "Artículo citado",
    guideTag: "Guía citada",
    closeLabel: "Cerrar",
    loadingLabel: "Cargando contexto editorial...",
  },
  en: {
    sectionTitle: "In the press",
    openContext: "Open context",
    sourceLabel: "Source",
    summaryLabel: "Editorial summary",
    contextLabel: "Context",
    relevanceLabel: "Why it matters",
    noteLabel: "Editorial note",
    quoteLabel: "Highlighted quote",
    articleTag: "Referenced article",
    guideTag: "Referenced guide",
    closeLabel: "Close",
    loadingLabel: "Loading editorial context...",
  },
  fr: {
    sectionTitle: "Dans la presse",
    openContext: "Voir le contexte",
    sourceLabel: "Source",
    summaryLabel: "Résumé éditorial",
    contextLabel: "Contexte",
    relevanceLabel: "Pourquoi c’est important",
    noteLabel: "Note éditoriale",
    quoteLabel: "Citation mise en avant",
    articleTag: "Article cité",
    guideTag: "Guide cité",
    closeLabel: "Fermer",
    loadingLabel: "Chargement du contexte éditorial...",
  },
  pt: {
    sectionTitle: "Na imprensa",
    openContext: "Ver contexto",
    sourceLabel: "Fonte",
    summaryLabel: "Resumo editorial",
    contextLabel: "Contexto",
    relevanceLabel: "Por que isso importa",
    noteLabel: "Nota editorial",
    quoteLabel: "Citação em destaque",
    articleTag: "Artigo citado",
    guideTag: "Guia citado",
    closeLabel: "Fechar",
    loadingLabel: "Carregando contexto editorial...",
  },
};

export function Press() {
  const { language } = useLanguage();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [contentById, setContentById] = useState<
    Record<string, Record<SupportedLanguage, PressContent>> | null
  >(null);

  const selected = useMemo(
    () => pressItems.find((item) => item.id === selectedCardId) ?? null,
    [selectedCardId],
  );

  const selectedContent = useMemo(() => {
    if (!selected || !contentById) {
      return null;
    }
    return contentById[selected.id]?.[language] ?? null;
  }, [contentById, language, selected]);

  useEffect(() => {
    if (!selectedCardId || contentById) {
      return;
    }

    let isMounted = true;

    import("@/content/landing/press-content").then((module) => {
      if (!isMounted) {
        return;
      }
      setContentById(module.pressContentById);
    });

    return () => {
      isMounted = false;
    };
  }, [contentById, selectedCardId]);

  useEffect(() => {
    if (!selected) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedCardId(null);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onEscape);
    };
  }, [selected]);

  const localizedUi = uiText[language];

  return (
    <>
      <div className="min-h-screen w-full bg-white dark:bg-background flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 py-12">
          <h2 className="text-gray-900 dark:text-white text-4xl sm:text-5xl font-bold text-center mb-12">
            {localizedUi.sectionTitle}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pressItems.map((item) => {
              const typeLabel =
                item.type === "guide"
                  ? localizedUi.guideTag
                  : localizedUi.articleTag;
              const TypeIcon = item.type === "guide" ? FileText : Newspaper;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedCardId(item.id)}
                  className="group rounded-2xl border border-border bg-card overflow-hidden text-left transition hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500"
                >
                  <div className="relative h-44 w-full">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide title-accent font-semibold">
                      <TypeIcon className="h-4 w-4" />
                      <span>{typeLabel}</span>
                    </div>

                    <h3 className="text-foreground font-bold text-lg leading-tight group-hover:text-yellow-500 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.excerpt[language]}
                    </p>

                    <p className="text-muted-foreground text-xs">
                      {item.author} · {item.publication}, {item.date}
                    </p>

                    <p className="text-sm font-semibold title-accent">
                      {localizedUi.openContext}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedCardId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-end p-4 bg-card/95 border-b border-border">
              <button
                type="button"
                onClick={() => setSelectedCardId(null)}
                className="rounded-full p-2 text-foreground hover:bg-muted transition"
                aria-label={localizedUi.closeLabel}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.35fr]">
              <div className="relative min-h-[280px] lg:min-h-full">
                <Image
                  src={selected.image}
                  alt={selected.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-wide title-accent font-semibold mb-2">
                    {selected.type === "guide"
                      ? localizedUi.guideTag
                      : localizedUi.articleTag}
                  </p>
                  <h3 className="text-foreground text-2xl sm:text-3xl font-bold">
                    {selected.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mt-2">
                    {selected.author} · {localizedUi.sourceLabel}: {selected.publication}, {selected.date}
                  </p>
                </div>

                {!selectedContent ? (
                  <section className="rounded-xl border border-border bg-muted/50 p-4">
                    <p className="text-foreground/90 leading-7">{localizedUi.loadingLabel}</p>
                  </section>
                ) : (
                  <>
                    <section className="rounded-xl border border-border bg-muted/50 p-4">
                      <p className="text-xs uppercase tracking-wide title-accent font-semibold mb-2">
                        {localizedUi.quoteLabel}
                      </p>
                      <p className="text-foreground italic leading-7">
                        “{selectedContent.quote}”
                      </p>
                    </section>

                    <section>
                      <h4 className="text-sm uppercase tracking-wide font-semibold text-foreground mb-2">
                        {localizedUi.summaryLabel}
                      </h4>
                      <p className="text-foreground/90 leading-7">{selectedContent.summary}</p>
                    </section>

                    <section>
                      <h4 className="text-sm uppercase tracking-wide font-semibold text-foreground mb-2">
                        {localizedUi.contextLabel}
                      </h4>
                      <div className="space-y-3">
                        {selectedContent.context.map((paragraph) => (
                          <p key={paragraph} className="text-foreground/90 leading-7">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h4 className="text-sm uppercase tracking-wide font-semibold text-foreground mb-2">
                        {localizedUi.relevanceLabel}
                      </h4>
                      <p className="text-foreground/90 leading-7">{selectedContent.relevance}</p>
                    </section>

                    <section className="rounded-xl border border-border bg-muted/40 p-4">
                      <h4 className="text-sm uppercase tracking-wide font-semibold text-foreground mb-2">
                        {localizedUi.noteLabel}
                      </h4>
                      <p className="text-muted-foreground text-sm leading-6">{selectedContent.note}</p>
                    </section>
                  </>
                )}

                <Button
                  type="button"
                  onClick={() => setSelectedCardId(null)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  {localizedUi.closeLabel}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
