'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { FileText, Newspaper, X } from 'lucide-react';
import { useLanguage } from '@/components/providers/language-provider';
import { Button } from '@/components/ui/button';
import type { SupportedLanguage } from '@/lib/language';

type PressType = 'article' | 'guide';

type PressContent = {
  quote: string;
  cardExcerpt: string;
  narrative: string;
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
    id: 'circulo-liceo',
    type: 'article',
    title: 'Ponente en el Círculo del Liceo',
    author: 'E. Llinás',
    publication: 'La Vanguardia',
    date: '4/05/2022',
    image: '/images/en la prensa1.jpeg',
    content: {
      es: {
        quote:
          'Enric Vázquez es la piedra angular de la veterana escena jazz de Barcelona.',
        cardExcerpt:
          'Reconocimiento de su papel como figura articuladora entre historia, divulgación y vida cultural del jazz en la ciudad.',
        narrative:
          'Esta referencia de La Vanguardia presenta a Enric Vázquez como una figura estructural en la historia viva del jazz en Barcelona. Al situarlo como “la piedra angular de la veterana escena jazz de Barcelona”, el texto no solo resalta prestigio personal: explica su papel como puente entre memoria cultural, divulgación y formación de nuevas audiencias. Su participación en espacios como el Círculo del Liceo refuerza ese perfil de mediador intelectual y artístico, capaz de conectar tradición y presente con una mirada pedagógica. Por eso esta mención importa: aporta contexto histórico, credibilidad editorial y una razón clara para entender su trabajo como una contribución sostenida al ecosistema cultural de la ciudad.',
      },
      en: {
        quote: 'Enric Vázquez is the cornerstone of Barcelona’s veteran jazz scene.',
        cardExcerpt:
          'Recognition of his role as a key bridge between jazz history, public outreach, and cultural education in the city.',
        narrative:
          'This La Vanguardia reference frames Enric Vázquez as a structural figure in Barcelona’s living jazz history. By describing him as “the cornerstone of Barcelona’s veteran jazz scene,” the piece does more than offer praise: it positions him as a bridge between cultural memory, public dissemination, and education for new audiences. His connection to venues such as Círculo del Liceo reinforces that role as an intellectual and artistic mediator who links legacy with the present in a clear pedagogical voice. Why this matters is straightforward: the mention provides historical context, editorial credibility, and a strong reason to read his work as a sustained contribution to the city’s cultural ecosystem.',
      },
      fr: {
        quote:
          'Enric Vázquez est la pierre angulaire de la scène jazz historique de Barcelone.',
        cardExcerpt:
          'Reconnaissance de son rôle de trait d’union entre mémoire du jazz, diffusion culturelle et transmission.',
        narrative:
          'Cette référence de La Vanguardia présente Enric Vázquez comme une figure structurante de la mémoire vivante du jazz à Barcelone. En le qualifiant de « pierre angulaire de la scène jazz historique de Barcelone », le texte dépasse l’éloge ponctuel: il le situe au croisement de la mémoire culturelle, de la diffusion et de la transmission vers de nouveaux publics. Son lien avec des espaces comme le Círculo del Liceo renforce cette position de médiateur intellectuel et artistique, capable d’articuler héritage et présent avec une dimension pédagogique claire. Pourquoi cela compte: cette mention apporte contexte historique, crédibilité éditoriale et une lecture cohérente de sa contribution durable à l’écosystème culturel de la ville.',
      },
      pt: {
        quote: 'Enric Vázquez é a pedra angular da veterana cena de jazz de Barcelona.',
        cardExcerpt:
          'Reconhecimento do seu papel como elo entre memória do jazz, divulgação cultural e formação de público.',
        narrative:
          'Esta referência da La Vanguardia posiciona Enric Vázquez como uma figura estruturante da memória viva do jazz em Barcelona. Ao defini-lo como “a pedra angular da veterana cena de jazz de Barcelona”, o texto vai além de um elogio isolado: mostra seu papel como ponte entre memória cultural, divulgação e formação de novos públicos. A ligação com espaços como o Círculo del Liceo reforça essa atuação como mediador intelectual e artístico, capaz de conectar legado e presente com uma voz pedagógica clara. O motivo de relevância é direto: a menção traz contexto histórico, credibilidade editorial e uma justificativa consistente para entender sua trajetória como contribuição contínua ao ecossistema cultural da cidade.',
      },
    },
  },
  {
    id: 'jamboree',
    type: 'article',
    title: 'Jamboree',
    author: 'J. Sagarra',
    publication: 'La Vanguardia',
    date: '19/01/2020',
    image: '/images/en la prensa2.jpeg',
    content: {
      es: {
        quote: 'La persona que mejor conoce el jazz de Barcelona desde los años 60.',
        cardExcerpt:
          'Referencia histórica que relaciona a Enric Vázquez con el núcleo fundacional de la escena moderna del jazz en Barcelona.',
        narrative:
          'La cita de Joan de Sagarra en La Vanguardia sitúa a Enric Vázquez en el corazón de la historia moderna del jazz barcelonés. Cuando lo describe como “la persona que mejor conoce el jazz de Barcelona desde los años 60”, la frase funciona como un testimonio de larga duración, construido desde la observación directa de una escena en transformación. El vínculo con Jamboree añade un contexto clave: no se trata de una lectura externa, sino de una trayectoria conectada con uno de los espacios más determinantes para la vida jazzística de la ciudad. En términos de valor editorial, esta referencia explica por qué su voz tiene autoridad práctica: combina memoria histórica, experiencia de terreno y capacidad de interpretar procesos culturales complejos.',
      },
      en: {
        quote: 'The person who best knows Barcelona jazz since the 1960s.',
        cardExcerpt:
          'A historical reference linking Enric Vázquez to the formative core of Barcelona’s modern jazz ecosystem.',
        narrative:
          'Joan de Sagarra’s quote in La Vanguardia places Enric Vázquez at the core of Barcelona’s modern jazz history. Calling him “the person who best knows Barcelona jazz since the 1960s” works as a long-range testimonial grounded in direct observation of a scene that evolved over decades. The link to Jamboree adds essential context: this is not an external interpretation, but a trajectory tied to one of the city’s most decisive jazz venues. In editorial terms, the value is clear: the reference explains why his voice carries practical authority by combining historical memory, field experience, and the ability to interpret complex cultural processes.',
      },
      fr: {
        quote: 'La personne qui connaît le mieux le jazz de Barcelone depuis les années 60.',
        cardExcerpt:
          'Référence historique reliant Enric Vázquez au noyau fondateur de la scène jazz moderne de Barcelone.',
        narrative:
          'La citation de Joan de Sagarra dans La Vanguardia place Enric Vázquez au centre de l’histoire moderne du jazz barcelonais. En le définissant comme « la personne qui connaît le mieux le jazz de Barcelone depuis les années 60 », le propos agit comme un témoignage de longue durée fondé sur l’observation directe d’une scène en évolution. La référence à Jamboree apporte le contexte décisif: il ne s’agit pas d’une lecture extérieure, mais d’un parcours lié à l’un des lieux les plus structurants du jazz dans la ville. Sur le plan éditorial, cela explique pourquoi sa parole possède une autorité de terrain, mêlant mémoire historique, expérience concrète et capacité d’analyse culturelle.',
      },
      pt: {
        quote: 'A pessoa que melhor conhece o jazz de Barcelona desde os anos 60.',
        cardExcerpt:
          'Referência histórica que liga Enric Vázquez ao núcleo formador da cena moderna de jazz em Barcelona.',
        narrative:
          'A citação de Joan de Sagarra na La Vanguardia coloca Enric Vázquez no centro da história moderna do jazz de Barcelona. Ao descrevê-lo como “a pessoa que melhor conhece o jazz de Barcelona desde os anos 60”, o texto funciona como um testemunho de longo prazo, construído a partir da observação direta de uma cena que se transformou ao longo de décadas. A relação com o Jamboree adiciona o contexto essencial: não é uma leitura externa, mas uma trajetória conectada a um dos espaços mais decisivos do jazz na cidade. Em termos editoriais, esse reconhecimento explica por que sua voz tem autoridade prática, reunindo memória histórica, vivência de campo e capacidade de interpretar processos culturais complexos.',
      },
    },
  },
  {
    id: 'guide-101',
    type: 'guide',
    title: 'Iwanowski Guide 101 Barcelona',
    author: 'K. Sommer',
    publication: 'Iwanowski Guide 101 Barcelona',
    date: '2023, p. 207',
    image: '/images/en la prensa3.jpeg',
    content: {
      es: {
        quote:
          'Enric Vázquez es el motor de la popularidad del jazz desde 1958, con publicaciones, emisiones de televisión, conferencias en círculos intelectuales y colaboración en la organización del primer festival de jazz de Barcelona.',
        cardExcerpt:
          'Bloque editorial bibliográfico que amplía el reconocimiento más allá de la prensa local y lo proyecta en una guía cultural internacional.',
        narrative:
          'La referencia en Iwanowski Guide 101 Barcelona amplía la lectura editorial de Enric Vázquez más allá del marco de la prensa local. Al afirmar que es “el motor de la popularidad del jazz desde 1958”, y al enumerar publicaciones, televisión, conferencias y colaboración en el primer festival de jazz de Barcelona, el texto describe una influencia transversal y sostenida en distintos frentes culturales. Este contexto es importante porque sitúa su trayectoria en una guía de alcance internacional, pensada para lectores y visitantes que buscan marcos fiables para entender la ciudad. En conjunto, la cita y su contexto refuerzan el porqué de su relevancia: no solo reconocimiento periodístico, sino proyección cultural consolidada en una fuente bibliográfica de referencia.',
      },
      en: {
        quote:
          'Enric Vázquez has driven jazz popularity since 1958 through publications, television broadcasts, lectures in intellectual circles, and collaboration in organizing Barcelona’s first jazz festival.',
        cardExcerpt:
          'A bibliographic editorial block that extends recognition beyond local press and into an international cultural guide context.',
        narrative:
          'The Iwanowski Guide 101 Barcelona reference extends Enric Vázquez’s editorial profile beyond local press coverage. By stating that he has “driven jazz popularity since 1958,” and by listing publications, television broadcasts, lectures, and collaboration in organizing Barcelona’s first jazz festival, the text portrays long-term, cross-functional influence across multiple cultural channels. This context matters because it places his trajectory inside an international guide aimed at readers and visitors who rely on trusted cultural framing. Taken together, the quote and context explain why this source is significant: it moves the narrative from journalistic recognition to consolidated cultural visibility in a bibliographic reference work.',
      },
      fr: {
        quote:
          'Enric Vázquez est un moteur de la popularité du jazz depuis 1958, à travers publications, émissions de télévision, conférences et collaboration au premier festival de jazz de Barcelone.',
        cardExcerpt:
          'Bloc éditorial bibliographique qui élargit la reconnaissance au-delà de la presse locale vers un cadre culturel international.',
        narrative:
          'La référence de Iwanowski Guide 101 Barcelona élargit la lecture éditoriale d’Enric Vázquez au-delà de la presse locale. En affirmant qu’il est « un moteur de la popularité du jazz depuis 1958 » et en mentionnant publications, télévision, conférences et collaboration au premier festival de jazz de Barcelone, le texte décrit une influence durable et transversale sur plusieurs canaux culturels. Ce contexte est décisif car il inscrit son parcours dans un guide international destiné à des lecteurs et visiteurs en quête de repères fiables. Ensemble, citation et contexte expliquent pourquoi cette source compte: elle prolonge la légitimité du récit vers une visibilité culturelle consolidée dans une référence bibliographique.',
      },
      pt: {
        quote:
          'Enric Vázquez é o motor da popularidade do jazz desde 1958, com publicações, programas de TV, conferências em círculos intelectuais e colaboração na organização do primeiro festival de jazz de Barcelona.',
        cardExcerpt:
          'Bloco editorial bibliográfico que amplia o reconhecimento para além da imprensa local e o posiciona em guia cultural internacional.',
        narrative:
          'A referência no Iwanowski Guide 101 Barcelona amplia a leitura editorial sobre Enric Vázquez para além da cobertura da imprensa local. Ao afirmar que ele é “o motor da popularidade do jazz desde 1958” e listar publicações, programas de TV, conferências e colaboração na organização do primeiro festival de jazz de Barcelona, o texto apresenta uma influência contínua e transversal em diferentes frentes culturais. Esse contexto é relevante porque posiciona sua trajetória em um guia internacional, voltado a leitores e visitantes que buscam referências confiáveis para compreender a cidade. Em conjunto, citação e contexto explicam o porquê da importância desta fonte: ela desloca a narrativa do reconhecimento jornalístico para uma visibilidade cultural consolidada em obra bibliográfica de referência.',
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
    articleTag: string;
    guideTag: string;
    closeLabel: string;
  }
> = {
  es: {
    sectionTitle: 'En la prensa',
    openContext: 'Ver contexto',
    sourceLabel: 'Fuente',
    articleTag: 'Artículo citado',
    guideTag: 'Guía citada',
    closeLabel: 'Cerrar',
  },
  en: {
    sectionTitle: 'In the press',
    openContext: 'Open context',
    sourceLabel: 'Source',
    articleTag: 'Referenced article',
    guideTag: 'Referenced guide',
    closeLabel: 'Close',
  },
  fr: {
    sectionTitle: 'Dans la presse',
    openContext: 'Voir le contexte',
    sourceLabel: 'Source',
    articleTag: 'Article cité',
    guideTag: 'Guide cité',
    closeLabel: 'Fermer',
  },
  pt: {
    sectionTitle: 'Na imprensa',
    openContext: 'Ver contexto',
    sourceLabel: 'Fonte',
    articleTag: 'Artigo citado',
    guideTag: 'Guia citado',
    closeLabel: 'Fechar',
  },
};

export function Press() {
  const { language } = useLanguage();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const selected = useMemo(
    () => pressItems.find((item) => item.id === selectedCardId) ?? null,
    [selectedCardId]
  );

  useEffect(() => {
    if (!selected) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedCardId(null);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onEscape);
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
              const typeLabel = item.type === 'guide' ? localizedUi.guideTag : localizedUi.articleTag;
              const TypeIcon = item.type === 'guide' ? FileText : Newspaper;

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

                    <p className="text-muted-foreground text-sm leading-relaxed">{content.cardExcerpt}</p>

                    <p className="text-muted-foreground text-xs">
                      {item.author} · {item.publication}, {item.date}
                    </p>

                    <p className="text-sm font-semibold title-accent">{localizedUi.openContext}</p>
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
            className="w-full max-w-4xl rounded-2xl border border-border bg-card"
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
                  className="object-cover"
                  quality={85}
                />
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-wide title-accent font-semibold mb-2">
                    {selected.type === 'guide' ? localizedUi.guideTag : localizedUi.articleTag}
                  </p>
                  <h3 className="text-foreground text-2xl sm:text-3xl font-bold">{selected.title}</h3>
                  <p className="text-muted-foreground text-sm mt-2">
                    {selected.author} · {localizedUi.sourceLabel}: {selected.publication}, {selected.date}
                  </p>
                </div>

                <section className="rounded-xl border border-border bg-muted/40 p-5">
                  <p className="text-foreground/90 leading-7">
                    “{selected.content[language].quote}”
                  </p>
                  <p className="text-foreground/90 leading-7 mt-4">{selected.content[language].narrative}</p>
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
