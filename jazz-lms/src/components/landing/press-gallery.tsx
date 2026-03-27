"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import type { SupportedLanguage } from "@/lib/language";
import { FileText, Newspaper, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type PressType = "article" | "guide";

type PressContent = {
  quote: string;
  cardExcerpt: string;
  summary: string;
  context: string[];
  relevance: string;
  note: string;
};

type PressItem = {
  id: string;
  type: PressType;
  title: string;
  author: string;
  publication: string;
  date: string;
  image: string;
  content: Record<SupportedLanguage, PressContent>;
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
    content: {
      es: {
        quote:
          "Enric Vázquez es la piedra angular de la veterana escena jazz de Barcelona.",
        cardExcerpt:
          "Reconocimiento de su papel como figura articuladora entre historia, divulgación y vida cultural del jazz en la ciudad.",
        summary:
          "La referencia destaca a Enric Vázquez como una voz de autoridad dentro de la memoria viva del jazz barcelonés. Más que una mención biográfica, proyecta una lectura de legado: alguien que conecta escena, conocimiento y pedagogía.",
        context: [
          "La vinculación con el Círculo del Liceo refuerza su perfil de divulgador en espacios culturales de alto valor simbólico.",
          "El encuadre editorial sugiere influencia sostenida, no solo presencia puntual, en la forma en que Barcelona entiende y narra su historia del jazz.",
        ],
        relevance:
          "Aporta legitimidad histórica e intelectual a la propuesta formativa, alineando trayectoria personal y patrimonio cultural de la ciudad.",
        note: "Texto editorial de contexto preparado con base en la referencia mostrada y la cita preservada en el proyecto; no equivale a transcripción íntegra del artículo.",
      },
      en: {
        quote:
          "Enric Vázquez is the cornerstone of Barcelona’s veteran jazz scene.",
        cardExcerpt:
          "Recognition of his role as a key bridge between jazz history, public outreach, and cultural education in the city.",
        summary:
          "This reference frames Enric Vázquez as an authoritative voice in Barcelona’s living jazz memory. Beyond a simple biographical mention, it signals legacy: someone linking scene-building, knowledge, and pedagogy.",
        context: [
          "The connection to Círculo del Liceo strengthens his profile as a speaker and cultural mediator in high-prestige venues.",
          "Editorially, the framing suggests long-term influence rather than occasional visibility in how Barcelona narrates its jazz history.",
        ],
        relevance:
          "It adds historical and intellectual credibility to the learning proposal by aligning personal trajectory with the city’s cultural heritage.",
        note: "Editorial context text prepared from the visible reference and quote stored in the project; it is not a full transcription of the original article.",
      },
      fr: {
        quote:
          "Enric Vázquez est la pierre angulaire de la scène jazz historique de Barcelone.",
        cardExcerpt:
          "Reconnaissance de son rôle de trait d’union entre mémoire du jazz, diffusion culturelle et transmission.",
        summary:
          "La référence présente Enric Vázquez comme une autorité dans la mémoire vivante du jazz barcelonais. Il ne s’agit pas d’une simple notice biographique, mais d’une lecture de long terme sur son apport culturel.",
        context: [
          "Le lien avec le Círculo del Liceo renforce son image de passeur dans des espaces culturels de forte valeur symbolique.",
          "Le cadrage éditorial indique une influence durable dans la manière dont Barcelone raconte et interprète sa tradition jazz.",
        ],
        relevance:
          "Ce bloc apporte crédibilité historique et profondeur intellectuelle à la proposition pédagogique.",
        note: "Texte éditorial de contexte rédigé à partir de la référence visible et de la citation conservée dans le projet ; il ne remplace pas la reproduction intégrale de l’article.",
      },
      pt: {
        quote:
          "Enric Vázquez é a pedra angular da veterana cena de jazz de Barcelona.",
        cardExcerpt:
          "Reconhecimento do seu papel como elo entre memória do jazz, divulgação cultural e formação de público.",
        summary:
          "A referência posiciona Enric Vázquez como voz de autoridade na memória viva do jazz barcelonês. Mais do que menção biográfica, ela comunica legado: alguém que conecta cena, conhecimento e pedagogia.",
        context: [
          "A relação com o Círculo del Liceo reforça seu perfil de mediador cultural em espaços de alto valor simbólico.",
          "O enquadramento editorial sugere influência contínua na forma como Barcelona preserva e comunica sua história do jazz.",
        ],
        relevance:
          "Esse bloco agrega legitimidade histórica e densidade intelectual à proposta de ensino.",
        note: "Texto editorial de contexto preparado com base na referência exibida e na citação preservada no projeto; não corresponde à transcrição integral do artigo original.",
      },
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
    content: {
      es: {
        quote:
          "La persona que mejor conoce el jazz de Barcelona desde los años 60.",
        cardExcerpt:
          "Referencia histórica que relaciona a Enric Vázquez con el núcleo fundacional de la escena moderna del jazz en Barcelona.",
        summary:
          "Este bloque funciona como aval testimonial. La cita enfatiza experiencia de primera mano en una etapa clave para la consolidación del jazz en la ciudad.",
        context: [
          "La mención a Jamboree conecta su figura con un espacio central en la evolución del jazz barcelonés.",
          "El tono sugiere conocimiento acumulado por participación real en procesos, redes y circuitos culturales desde los años sesenta.",
        ],
        relevance:
          "Contribuye a la narrativa de autoridad práctica: no solo teoría, sino vivencia histórica directa de la escena.",
        note: "Texto editorial de contexto construido a partir de la referencia visible en la sección y fuentes públicas relacionadas con Jamboree y Joan de Sagarra.",
      },
      en: {
        quote: "The person who best knows Barcelona jazz since the 1960s.",
        cardExcerpt:
          "A historical reference linking Enric Vázquez to the formative core of Barcelona’s modern jazz ecosystem.",
        summary:
          "This block acts as testimonial validation. The quote emphasizes first-hand experience during a decisive period in the city’s jazz development.",
        context: [
          "The Jamboree reference ties his profile to one of Barcelona’s defining jazz venues.",
          "The framing points to accumulated knowledge shaped by direct participation in local cultural networks since the 1960s.",
        ],
        relevance:
          "It reinforces practical authority: not only conceptual expertise, but lived historical involvement in the scene.",
        note: "Editorial context text built from the visible reference in the section and public sources related to Jamboree and Joan de Sagarra.",
      },
      fr: {
        quote:
          "La personne qui connaît le mieux le jazz de Barcelone depuis les années 60.",
        cardExcerpt:
          "Référence historique reliant Enric Vázquez au noyau fondateur de la scène jazz moderne de Barcelone.",
        summary:
          "Ce bloc agit comme validation testimoniale. La citation met en avant une expérience directe à une période charnière pour la consolidation du jazz dans la ville.",
        context: [
          "La mention de Jamboree associe son parcours à un lieu majeur de l’évolution du jazz barcelonais.",
          "Le cadrage suggère un savoir construit par participation active aux réseaux culturels locaux depuis les années soixante.",
        ],
        relevance:
          "Il renforce l’idée d’une autorité de terrain : au-delà du discours, une implication historique réelle.",
        note: "Texte éditorial de contexte rédigé à partir de la référence visible et de sources publiques liées à Jamboree et Joan de Sagarra.",
      },
      pt: {
        quote:
          "A pessoa que melhor conhece o jazz de Barcelona desde os anos 60.",
        cardExcerpt:
          "Referência histórica que liga Enric Vázquez ao núcleo formador da cena moderna de jazz em Barcelona.",
        summary:
          "Este bloco funciona como validação testemunhal. A citação destaca vivência direta em um período decisivo para a consolidação do jazz na cidade.",
        context: [
          "A menção ao Jamboree conecta sua trajetória a um espaço central da evolução do jazz barcelonês.",
          "O enquadramento sugere conhecimento acumulado por participação efetiva em redes e circuitos culturais locais desde os anos 60.",
        ],
        relevance:
          "Reforça a noção de autoridade prática: não apenas discurso, mas experiência histórica concreta da cena.",
        note: "Texto editorial de contexto construído a partir da referência visível na seção e de fontes públicas relacionadas a Jamboree e Joan de Sagarra.",
      },
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
    content: {
      es: {
        quote:
          "Enric Vázquez es el motor de la popularidad del jazz desde 1958, con publicaciones, emisiones de televisión, conferencias en círculos intelectuales y colaboración en la organización del primer festival de jazz de Barcelona.",
        cardExcerpt:
          "Bloque editorial bibliográfico que amplía el reconocimiento más allá de la prensa local y lo proyecta en una guía cultural internacional.",
        summary:
          "Este tercer bloque no corresponde a un artículo de prensa tradicional, sino a una referencia de guía cultural. Su valor es estratégico: demuestra presencia en un marco editorial orientado a visitantes y lectores internacionales.",
        context: [
          "La formulación enfatiza continuidad histórica desde 1958 y una contribución transversal en divulgación, medios y organización cultural.",
          "En la UX se presenta como guía citada para mantener precisión semántica y distinguir claramente su naturaleza respecto a los otros dos bloques.",
        ],
        relevance:
          "Amplía la narrativa de legitimidad: del reconocimiento periodístico local a la proyección cultural de alcance internacional.",
        note: "Referencia tratada como contenido editorial bibliográfico. El bloque está redactado para precisión contextual y no como reproducción de página completa del libro.",
      },
      en: {
        quote:
          "Enric Vázquez has driven jazz popularity since 1958 through publications, television broadcasts, lectures in intellectual circles, and collaboration in organizing Barcelona’s first jazz festival.",
        cardExcerpt:
          "A bibliographic editorial block that extends recognition beyond local press and into an international cultural guide context.",
        summary:
          "This third block is not a standard press article but a guidebook reference. Its strategic value is clear: it places his profile within editorial material aimed at international readers and visitors.",
        context: [
          "The wording highlights long-term continuity since 1958 and a cross-functional contribution across publishing, media, and cultural organization.",
          "In the interface, it is labeled as a cited guide to preserve semantic accuracy and clearly distinguish it from the two press references.",
        ],
        relevance:
          "It expands legitimacy from local journalistic recognition to broader international cultural visibility.",
        note: "Handled as bibliographic editorial content. The block is written for contextual precision, not as a full-page reproduction of the source book.",
      },
      fr: {
        quote:
          "Enric Vázquez est un moteur de la popularité du jazz depuis 1958, à travers publications, émissions de télévision, conférences et collaboration au premier festival de jazz de Barcelone.",
        cardExcerpt:
          "Bloc éditorial bibliographique qui élargit la reconnaissance au-delà de la presse locale vers un cadre culturel international.",
        summary:
          "Ce troisième bloc ne correspond pas à un article de presse classique, mais à une référence de guide culturel. Sa valeur est de projeter le profil dans un dispositif éditorial destiné à un public international.",
        context: [
          "Le texte met en avant une continuité depuis 1958 et une contribution transversale à la diffusion culturelle du jazz.",
          "Dans l’interface, il est présenté comme guide cité afin de conserver la précision sémantique et de le distinguer des deux références de presse.",
        ],
        relevance:
          "Il élargit la légitimité du récit: de la presse locale à la visibilité culturelle internationale.",
        note: "Référence traitée comme contenu éditorial bibliographique. Le texte vise la précision contextuelle et non la reproduction intégrale de la source.",
      },
      pt: {
        quote:
          "Enric Vázquez é o motor da popularidade do jazz desde 1958, com publicações, programas de TV, conferências em círculos intelectuais e colaboração na organização do primeiro festival de jazz de Barcelona.",
        cardExcerpt:
          "Bloco editorial bibliográfico que amplia o reconhecimento para além da imprensa local e o posiciona em guia cultural internacional.",
        summary:
          "Este terceiro bloco não corresponde a matéria jornalística tradicional, mas a referência em guia cultural. Seu valor estratégico é ampliar a projeção editorial para leitores e visitantes de fora do circuito local.",
        context: [
          "A formulação destaca continuidade histórica desde 1958 e contribuição transversal em divulgação, mídia e organização cultural.",
          "Na interface, ele aparece como guia citado para manter precisão semântica e diferenciar claramente sua natureza em relação aos dois blocos de imprensa.",
        ],
        relevance:
          "Amplia a legitimidade do discurso: do reconhecimento jornalístico local para visibilidade cultural internacional.",
        note: "Referência tratada como conteúdo editorial bibliográfico. O texto foi escrito para precisão contextual e não como reprodução integral da fonte.",
      },
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
  },
};

export function Press() {
  const { language } = useLanguage();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const selected = useMemo(
    () => pressItems.find((item) => item.id === selectedCardId) ?? null,
    [selectedCardId],
  );

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
              const content = item.content[language];
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
                      quality={80}
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
                      {content.cardExcerpt}
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
                  quality={85}
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
                    {selected.author} · {localizedUi.sourceLabel}:{" "}
                    {selected.publication}, {selected.date}
                  </p>
                </div>

                <section className="rounded-xl border border-border bg-muted/50 p-4">
                  <p className="text-xs uppercase tracking-wide title-accent font-semibold mb-2">
                    {localizedUi.quoteLabel}
                  </p>
                  <p className="text-foreground italic leading-7">
                    “{selected.content[language].quote}”
                  </p>
                </section>

                <section>
                  <h4 className="text-sm uppercase tracking-wide font-semibold text-foreground mb-2">
                    {localizedUi.summaryLabel}
                  </h4>
                  <p className="text-foreground/90 leading-7">
                    {selected.content[language].summary}
                  </p>
                </section>

                <section>
                  <h4 className="text-sm uppercase tracking-wide font-semibold text-foreground mb-2">
                    {localizedUi.contextLabel}
                  </h4>
                  <div className="space-y-3">
                    {selected.content[language].context.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="text-foreground/90 leading-7"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="text-sm uppercase tracking-wide font-semibold text-foreground mb-2">
                    {localizedUi.relevanceLabel}
                  </h4>
                  <p className="text-foreground/90 leading-7">
                    {selected.content[language].relevance}
                  </p>
                </section>

                <section className="rounded-xl border border-border bg-muted/40 p-4">
                  <h4 className="text-sm uppercase tracking-wide font-semibold text-foreground mb-2">
                    {localizedUi.noteLabel}
                  </h4>
                  <p className="text-muted-foreground text-sm leading-6">
                    {selected.content[language].note}
                  </p>
                </section>

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
