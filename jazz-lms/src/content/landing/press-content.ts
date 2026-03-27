import type { SupportedLanguage } from "@/lib/language";

export type PressContent = {
  quote: string;
  summary: string;
  context: string[];
  relevance: string;
  note: string;
};

export const pressContentById: Record<
  string,
  Record<SupportedLanguage, PressContent>
> = {
  "circulo-liceo": {
    es: {
      quote:
        "Enric Vázquez es la piedra angular de la veterana escena jazz de Barcelona.",
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
  jamboree: {
    es: {
      quote:
        "La persona que mejor conoce el jazz de Barcelona desde los años 60.",
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
  "guide-101": {
    es: {
      quote:
        "Enric Vázquez es el motor de la popularidad del jazz desde 1958, con publicaciones, emisiones de televisión, conferencias en círculos intelectuales y colaboración en la organización del primer festival de jazz de Barcelona.",
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
};
