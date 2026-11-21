'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/providers/language-provider';
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/language';

export const PRIVACY_CONTACT_EMAIL = 'info@neurofactory.net';
export const PRIVACY_CONTROLLER = 'Neurofactory (Gabriel Oliveira-Barra)';

// Rendered in order: lead paragraphs, list items, closing paragraphs.
type PolicySection = { title: string; lead?: string[]; items?: string[]; paragraphs?: string[] };
type PolicyCopy = {
  back: string;
  title: string;
  updated: string;
  intro: string;
  languageLabel: string;
  sections: PolicySection[];
};

const EMAIL = PRIVACY_CONTACT_EMAIL;
const CONTROLLER = PRIVACY_CONTROLLER;

export const PRIVACY_POLICY_COPY: Record<SupportedLanguage, PolicyCopy> = {
  es: {
    back: 'Volver a La Cultura del Jazz',
    title: 'Política de privacidad',
    updated: 'Última actualización: 21 de noviembre de 2026',
    intro: 'Esta política explica qué datos personales tratamos cuando usas www.culturadeljazz.com y el curso online «La Cultura del Jazz», para qué los usamos y qué derechos tienes.',
    languageLabel: 'Idioma',
    sections: [
      {
        title: '1. Responsable del tratamiento',
        paragraphs: [
          `El responsable es ${CONTROLLER}. Para cualquier cuestión sobre privacidad puedes escribir a ${EMAIL}.`,
          'El curso lo imparte Enric Vázquez Ramonich.',
        ],
      },
      {
        title: '2. Qué datos tratamos',
        items: [
          'Datos de cuenta: correo electrónico, nombre y contraseña. La contraseña se guarda cifrada mediante una función hash y nunca la vemos.',
          'Inicio de sesión con Google: si eliges esta opción, Google nos facilita tu nombre, tu correo electrónico, tu foto de perfil y el identificador de tu cuenta de Google. No accedemos a ningún otro dato de tu cuenta de Google.',
          'Compras: referencia del pago, importe, moneda, fecha y, en su caso, el vale o cupón utilizado. Los datos de tu tarjeta los trata directamente Dodo Payments; nosotros no los recibimos ni los guardamos.',
          'Actividad de aprendizaje: lecciones vistas y progreso, notas que escribes, respuestas y resultados de los cuestionarios, medallas y certificados.',
          'Comunicaciones: los mensajes que nos envías y los correos de servicio que te enviamos (verificación de cuenta, recuperación de contraseña).',
          'Datos técnicos: dirección IP, tipo de navegador y registros de seguridad necesarios para que el servicio funcione y esté protegido.',
          'Solo si lo aceptas: estadísticas de uso y de calidad de vídeo, y grabaciones de navegación en la página de inicio (los formularios y el contenido de los vídeos se ocultan).',
        ],
      },
      {
        title: '3. Para qué los usamos y con qué base legal',
        items: [
          'Prestarte el servicio que contratas o solicitas: crear y mantener tu cuenta, darte acceso a las lecciones y materiales, guardar tu progreso, emitir certificados y atender tus consultas (ejecución del contrato).',
          'Gestionar compras, reembolsos y obligaciones contables y fiscales (ejecución del contrato y obligación legal).',
          'Proteger el servicio, prevenir fraudes y abusos y resolver incidencias técnicas (interés legítimo).',
          'Medir el uso y la calidad del vídeo y mejorar la web, solo con tu consentimiento, que puedes retirar en cualquier momento desde el botón «Privacidad».',
        ],
        paragraphs: [
          'No vendemos tus datos, no los usamos para publicidad y no tomamos decisiones automatizadas que te afecten de forma significativa.',
        ],
      },
      {
        title: '4. Con quién los compartimos',
        lead: [
          'Solo con los proveedores que necesitamos para prestar el servicio, que tratan los datos siguiendo nuestras instrucciones o, en el caso de los pagos, como responsables independientes:',
        ],
        items: [
          'Supabase: autenticación, base de datos y almacenamiento de archivos (región de la Unión Europea, Irlanda).',
          'Cloudflare: red, DNS y protección de la web.',
          'Mux: reproducción de los vídeos del curso.',
          'Dodo Payments: procesamiento de pagos como vendedor registrado (Merchant of Record); trata tus datos de pago según su propia política de privacidad.',
          'Resend: envío de correos de servicio.',
          'Google: inicio de sesión con Google, si eliges usarlo.',
          'Spotify: el reproductor de la lista de reproducción integrada se carga desde Spotify, que aplica su propia política de privacidad.',
        ],
      },
      {
        title: '5. Transferencias internacionales',
        paragraphs: [
          'Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico Europeo o de Andorra, por ejemplo en Estados Unidos. En esos casos lo hacen con garantías adecuadas, como decisiones de adecuación o cláusulas contractuales tipo.',
        ],
      },
      {
        title: '6. Cuánto tiempo los conservamos',
        items: [
          'Los datos de tu cuenta y de aprendizaje, mientras tu cuenta esté activa. Si pides que la eliminemos, los borraremos en un plazo máximo de 30 días.',
          'Los registros de compras, durante el plazo que exija la normativa contable y fiscal.',
          'Los registros técnicos y de seguridad, solo el tiempo necesario para su finalidad.',
        ],
      },
      {
        title: '7. Tus derechos',
        paragraphs: [
          `Puedes solicitar el acceso, la rectificación, la supresión, la limitación del tratamiento, la portabilidad de tus datos u oponerte a su tratamiento escribiendo a ${EMAIL}. También puedes retirar tu consentimiento en cualquier momento, sin que ello afecte a la licitud del tratamiento anterior.`,
          'Si consideras que no hemos tratado tus datos correctamente, puedes presentar una reclamación ante la autoridad de protección de datos competente, por ejemplo la de tu país de residencia.',
        ],
      },
      {
        title: '8. Cookies y almacenamiento local',
        items: [
          'Necesarios: cookies de sesión para mantenerte conectado, y preferencias de idioma, de tema y de privacidad. No requieren consentimiento porque sin ellos la web no funciona como esperas.',
          'Opcionales: estadísticas y grabaciones de navegación, solo si las aceptas en el aviso de privacidad. Puedes cambiar tu elección en cualquier momento desde el botón «Privacidad».',
          'No usamos cookies de publicidad.',
        ],
      },
      {
        title: '9. Seguridad',
        paragraphs: [
          'Toda la comunicación con la web va cifrada (HTTPS), el acceso a los datos está restringido a quien lo necesita y las contraseñas se guardan con hash.',
        ],
      },
      {
        title: '10. Menores',
        paragraphs: [
          'Si tienes menos de 16 años, necesitas el consentimiento de tus padres o tutores para crear una cuenta.',
        ],
      },
      {
        title: '11. Cambios en esta política',
        paragraphs: [
          'Si cambiamos esta política, publicaremos la nueva versión en esta página con su fecha. Si el cambio es importante, te avisaremos por correo electrónico.',
        ],
      },
    ],
  },
  en: {
    back: 'Back to La Cultura del Jazz',
    title: 'Privacy policy',
    updated: 'Last updated: November 21, 2026',
    intro: 'This policy explains what personal data we process when you use www.culturadeljazz.com and the online course “La Cultura del Jazz”, what we use it for and what rights you have.',
    languageLabel: 'Language',
    sections: [
      {
        title: '1. Data controller',
        paragraphs: [
          `The controller is ${CONTROLLER}. For any privacy question, write to ${EMAIL}.`,
          'The course is taught by Enric Vázquez Ramonich.',
        ],
      },
      {
        title: '2. What data we process',
        items: [
          'Account data: email address, name and password. The password is stored as a hash and we never see it.',
          'Sign in with Google: if you choose this option, Google gives us your name, email address, profile picture and Google account identifier. We do not access any other data in your Google account.',
          'Purchases: payment reference, amount, currency, date and, where applicable, the voucher or coupon used. Your card details are handled directly by Dodo Payments; we never receive or store them.',
          'Learning activity: lessons watched and progress, notes you write, quiz answers and results, medals and certificates.',
          'Communications: messages you send us and service emails we send you (account verification, password recovery).',
          'Technical data: IP address, browser type and the security logs needed to run and protect the service.',
          'Only if you accept: usage and video-quality statistics, and navigation recordings on the homepage (forms and video content are hidden).',
        ],
      },
      {
        title: '3. Why we use it and on what legal basis',
        items: [
          'To provide the service you sign up for or request: creating and maintaining your account, giving you access to lessons and materials, saving your progress, issuing certificates and answering your questions (performance of a contract).',
          'To handle purchases, refunds and accounting and tax obligations (performance of a contract and legal obligation).',
          'To protect the service, prevent fraud and abuse and fix technical problems (legitimate interest).',
          'To measure usage and video quality and improve the site, only with your consent, which you can withdraw at any time with the “Privacy” button.',
        ],
        paragraphs: [
          'We do not sell your data, we do not use it for advertising and we do not make automated decisions that significantly affect you.',
        ],
      },
      {
        title: '4. Who we share it with',
        lead: [
          'Only with the providers we need to run the service. They process data on our instructions or, for payments, as independent controllers:',
        ],
        items: [
          'Supabase: authentication, database and file storage (European Union region, Ireland).',
          'Cloudflare: network, DNS and website protection.',
          'Mux: playback of the course videos.',
          'Dodo Payments: payment processing as Merchant of Record; it handles your payment data under its own privacy policy.',
          'Resend: sending service emails.',
          'Google: sign in with Google, if you choose to use it.',
          'Spotify: the embedded playlist player is loaded from Spotify, which applies its own privacy policy.',
        ],
      },
      {
        title: '5. International transfers',
        paragraphs: [
          'Some of these providers may process data outside the European Economic Area or Andorra, for example in the United States. In those cases they do so with appropriate safeguards, such as adequacy decisions or standard contractual clauses.',
        ],
      },
      {
        title: '6. How long we keep it',
        items: [
          'Account and learning data, while your account is active. If you ask us to delete it, we will do so within 30 days.',
          'Purchase records, for the period required by accounting and tax law.',
          'Technical and security logs, only as long as needed for their purpose.',
        ],
      },
      {
        title: '7. Your rights',
        paragraphs: [
          `You can request access, rectification, erasure, restriction of processing or portability of your data, or object to its processing, by writing to ${EMAIL}. You can also withdraw your consent at any time, without affecting the lawfulness of earlier processing.`,
          'If you believe we have not handled your data correctly, you can lodge a complaint with the competent data protection authority, for example the one in your country of residence.',
        ],
      },
      {
        title: '8. Cookies and local storage',
        items: [
          'Necessary: session cookies that keep you signed in, and your language, theme and privacy preferences. They do not need consent because the site does not work as expected without them.',
          'Optional: statistics and navigation recordings, only if you accept them in the privacy notice. You can change your choice at any time with the “Privacy” button.',
          'We do not use advertising cookies.',
        ],
      },
      {
        title: '9. Security',
        paragraphs: [
          'All communication with the site is encrypted (HTTPS), access to data is limited to those who need it, and passwords are stored as hashes.',
        ],
      },
      {
        title: '10. Children',
        paragraphs: [
          'If you are under 16, you need the consent of a parent or guardian to create an account.',
        ],
      },
      {
        title: '11. Changes to this policy',
        paragraphs: [
          'If we change this policy, we will publish the new version on this page with its date. If the change is significant, we will let you know by email.',
        ],
      },
    ],
  },
  fr: {
    back: 'Retour à La Cultura del Jazz',
    title: 'Politique de confidentialité',
    updated: 'Dernière mise à jour : 21 novembre 2026',
    intro: 'Cette politique explique quelles données personnelles nous traitons lorsque vous utilisez www.culturadeljazz.com et le cours en ligne « La Cultura del Jazz », à quoi elles servent et quels sont vos droits.',
    languageLabel: 'Langue',
    sections: [
      {
        title: '1. Responsable du traitement',
        paragraphs: [
          `Le responsable est ${CONTROLLER}. Pour toute question relative à la confidentialité, écrivez à ${EMAIL}.`,
          'Le cours est donné par Enric Vázquez Ramonich.',
        ],
      },
      {
        title: '2. Données traitées',
        items: [
          'Données de compte : adresse e-mail, nom et mot de passe. Le mot de passe est stocké sous forme de hachage et nous ne le voyons jamais.',
          'Connexion avec Google : si vous choisissez cette option, Google nous transmet votre nom, votre adresse e-mail, votre photo de profil et l’identifiant de votre compte Google. Nous n’accédons à aucune autre donnée de votre compte Google.',
          'Achats : référence du paiement, montant, devise, date et, le cas échéant, le bon ou coupon utilisé. Les données de votre carte sont traitées directement par Dodo Payments ; nous ne les recevons ni ne les conservons.',
          'Activité d’apprentissage : leçons vues et progression, notes que vous rédigez, réponses et résultats des quiz, médailles et certificats.',
          'Communications : les messages que vous nous envoyez et les e-mails de service que nous vous envoyons (vérification du compte, récupération du mot de passe).',
          'Données techniques : adresse IP, type de navigateur et journaux de sécurité nécessaires au fonctionnement et à la protection du service.',
          'Uniquement si vous l’acceptez : statistiques d’utilisation et de qualité vidéo, et enregistrements de navigation sur la page d’accueil (les formulaires et le contenu des vidéos sont masqués).',
        ],
      },
      {
        title: '3. Finalités et bases juridiques',
        items: [
          'Fournir le service que vous souscrivez ou demandez : créer et gérer votre compte, vous donner accès aux leçons et aux supports, enregistrer votre progression, délivrer des certificats et répondre à vos questions (exécution du contrat).',
          'Gérer les achats, les remboursements et les obligations comptables et fiscales (exécution du contrat et obligation légale).',
          'Protéger le service, prévenir la fraude et les abus et résoudre les problèmes techniques (intérêt légitime).',
          'Mesurer l’utilisation et la qualité vidéo et améliorer le site, uniquement avec votre consentement, que vous pouvez retirer à tout moment avec le bouton « Confidentialité ».',
        ],
        paragraphs: [
          'Nous ne vendons pas vos données, nous ne les utilisons pas à des fins publicitaires et nous ne prenons pas de décisions automatisées qui vous affectent de manière significative.',
        ],
      },
      {
        title: '4. Destinataires',
        lead: [
          'Uniquement les prestataires nécessaires au fonctionnement du service. Ils traitent les données selon nos instructions ou, pour les paiements, en tant que responsables indépendants :',
        ],
        items: [
          'Supabase : authentification, base de données et stockage de fichiers (région de l’Union européenne, Irlande).',
          'Cloudflare : réseau, DNS et protection du site.',
          'Mux : lecture des vidéos du cours.',
          'Dodo Payments : traitement des paiements en tant que vendeur officiel (Merchant of Record) ; il traite vos données de paiement selon sa propre politique de confidentialité.',
          'Resend : envoi des e-mails de service.',
          'Google : connexion avec Google, si vous choisissez de l’utiliser.',
          'Spotify : le lecteur de la playlist intégrée est chargé depuis Spotify, qui applique sa propre politique de confidentialité.',
        ],
      },
      {
        title: '5. Transferts internationaux',
        paragraphs: [
          'Certains de ces prestataires peuvent traiter des données en dehors de l’Espace économique européen ou d’Andorre, par exemple aux États-Unis. Ils le font alors avec des garanties appropriées, comme des décisions d’adéquation ou des clauses contractuelles types.',
        ],
      },
      {
        title: '6. Durée de conservation',
        items: [
          'Les données de compte et d’apprentissage, tant que votre compte est actif. Si vous demandez sa suppression, nous les effacerons dans un délai de 30 jours.',
          'Les enregistrements d’achats, pendant la durée exigée par la réglementation comptable et fiscale.',
          'Les journaux techniques et de sécurité, uniquement le temps nécessaire à leur finalité.',
        ],
      },
      {
        title: '7. Vos droits',
        paragraphs: [
          `Vous pouvez demander l’accès, la rectification, l’effacement, la limitation du traitement ou la portabilité de vos données, ou vous opposer à leur traitement, en écrivant à ${EMAIL}. Vous pouvez aussi retirer votre consentement à tout moment, sans que cela affecte la licéité du traitement antérieur.`,
          'Si vous estimez que nous n’avons pas traité vos données correctement, vous pouvez introduire une réclamation auprès de l’autorité de protection des données compétente, par exemple celle de votre pays de résidence.',
        ],
      },
      {
        title: '8. Cookies et stockage local',
        items: [
          'Nécessaires : cookies de session pour rester connecté, et préférences de langue, de thème et de confidentialité. Ils ne nécessitent pas de consentement car le site ne fonctionne pas comme prévu sans eux.',
          'Facultatifs : statistiques et enregistrements de navigation, uniquement si vous les acceptez dans l’avis de confidentialité. Vous pouvez modifier votre choix à tout moment avec le bouton « Confidentialité ».',
          'Nous n’utilisons pas de cookies publicitaires.',
        ],
      },
      {
        title: '9. Sécurité',
        paragraphs: [
          'Toutes les communications avec le site sont chiffrées (HTTPS), l’accès aux données est limité aux personnes qui en ont besoin et les mots de passe sont stockés sous forme de hachage.',
        ],
      },
      {
        title: '10. Mineurs',
        paragraphs: [
          'Si vous avez moins de 16 ans, vous avez besoin du consentement d’un parent ou tuteur pour créer un compte.',
        ],
      },
      {
        title: '11. Modifications de cette politique',
        paragraphs: [
          'Si nous modifions cette politique, nous publierons la nouvelle version sur cette page avec sa date. Si la modification est importante, nous vous en informerons par e-mail.',
        ],
      },
    ],
  },
  pt: {
    back: 'Voltar para La Cultura del Jazz',
    title: 'Política de privacidade',
    updated: 'Última atualização: 21 de novembro de 2026',
    intro: 'Esta política explica quais dados pessoais tratamos quando você usa www.culturadeljazz.com e o curso online “La Cultura del Jazz”, para que os usamos e quais são os seus direitos.',
    languageLabel: 'Idioma',
    sections: [
      {
        title: '1. Responsável pelo tratamento',
        paragraphs: [
          `O responsável é ${CONTROLLER}. Para qualquer questão sobre privacidade, escreva para ${EMAIL}.`,
          'O curso é ministrado por Enric Vázquez Ramonich.',
        ],
      },
      {
        title: '2. Quais dados tratamos',
        items: [
          'Dados da conta: e-mail, nome e senha. A senha é armazenada como hash e nunca a vemos.',
          'Login com o Google: se você escolher esta opção, o Google nos fornece seu nome, seu e-mail, sua foto de perfil e o identificador da sua conta Google. Não acessamos nenhum outro dado da sua conta Google.',
          'Compras: referência do pagamento, valor, moeda, data e, quando aplicável, o vale ou cupom utilizado. Os dados do seu cartão são tratados diretamente pela Dodo Payments; nós não os recebemos nem os armazenamos.',
          'Atividade de aprendizagem: aulas assistidas e progresso, notas que você escreve, respostas e resultados dos questionários, medalhas e certificados.',
          'Comunicações: as mensagens que você nos envia e os e-mails de serviço que lhe enviamos (verificação da conta, recuperação de senha).',
          'Dados técnicos: endereço IP, tipo de navegador e registros de segurança necessários para o funcionamento e a proteção do serviço.',
          'Somente se você aceitar: estatísticas de uso e de qualidade de vídeo, e gravações de navegação na página inicial (formulários e conteúdo dos vídeos ficam ocultos).',
        ],
      },
      {
        title: '3. Para que os usamos e com que base legal',
        items: [
          'Prestar o serviço que você contrata ou solicita: criar e manter sua conta, dar acesso às aulas e materiais, salvar seu progresso, emitir certificados e responder às suas perguntas (execução do contrato).',
          'Gerir compras, reembolsos e obrigações contábeis e fiscais (execução do contrato e obrigação legal).',
          'Proteger o serviço, prevenir fraudes e abusos e resolver problemas técnicos (interesse legítimo).',
          'Medir o uso e a qualidade do vídeo e melhorar o site, somente com o seu consentimento, que você pode retirar a qualquer momento pelo botão “Privacidade”.',
        ],
        paragraphs: [
          'Não vendemos seus dados, não os usamos para publicidade e não tomamos decisões automatizadas que o afetem de forma significativa.',
        ],
      },
      {
        title: '4. Com quem os compartilhamos',
        lead: [
          'Somente com os fornecedores necessários para prestar o serviço. Eles tratam os dados seguindo nossas instruções ou, no caso dos pagamentos, como responsáveis independentes:',
        ],
        items: [
          'Supabase: autenticação, banco de dados e armazenamento de arquivos (região da União Europeia, Irlanda).',
          'Cloudflare: rede, DNS e proteção do site.',
          'Mux: reprodução dos vídeos do curso.',
          'Dodo Payments: processamento de pagamentos como vendedor registrado (Merchant of Record); trata seus dados de pagamento segundo a sua própria política de privacidade.',
          'Resend: envio de e-mails de serviço.',
          'Google: login com o Google, se você optar por usá-lo.',
          'Spotify: o player da playlist integrada é carregado a partir do Spotify, que aplica a sua própria política de privacidade.',
        ],
      },
      {
        title: '5. Transferências internacionais',
        paragraphs: [
          'Alguns desses fornecedores podem tratar dados fora do Espaço Econômico Europeu ou de Andorra, por exemplo nos Estados Unidos. Nesses casos, fazem-no com garantias adequadas, como decisões de adequação ou cláusulas contratuais-padrão.',
        ],
      },
      {
        title: '6. Por quanto tempo os conservamos',
        items: [
          'Os dados da conta e de aprendizagem, enquanto sua conta estiver ativa. Se você pedir a exclusão, os apagaremos em até 30 dias.',
          'Os registros de compras, pelo prazo exigido pela legislação contábil e fiscal.',
          'Os registros técnicos e de segurança, apenas pelo tempo necessário à sua finalidade.',
        ],
      },
      {
        title: '7. Seus direitos',
        paragraphs: [
          `Você pode solicitar o acesso, a retificação, a exclusão, a limitação do tratamento ou a portabilidade dos seus dados, ou se opor ao seu tratamento, escrevendo para ${EMAIL}. Também pode retirar o seu consentimento a qualquer momento, sem afetar a licitude do tratamento anterior.`,
          'Se considerar que não tratamos seus dados corretamente, você pode apresentar uma reclamação à autoridade de proteção de dados competente, por exemplo a do seu país de residência.',
        ],
      },
      {
        title: '8. Cookies e armazenamento local',
        items: [
          'Necessários: cookies de sessão para manter você conectado, e preferências de idioma, de tema e de privacidade. Não exigem consentimento porque o site não funciona como esperado sem eles.',
          'Opcionais: estatísticas e gravações de navegação, somente se você as aceitar no aviso de privacidade. Você pode alterar sua escolha a qualquer momento pelo botão “Privacidade”.',
          'Não usamos cookies de publicidade.',
        ],
      },
      {
        title: '9. Segurança',
        paragraphs: [
          'Toda a comunicação com o site é criptografada (HTTPS), o acesso aos dados é restrito a quem precisa dele e as senhas são armazenadas como hash.',
        ],
      },
      {
        title: '10. Menores',
        paragraphs: [
          'Se você tiver menos de 16 anos, precisa do consentimento dos seus pais ou responsáveis para criar uma conta.',
        ],
      },
      {
        title: '11. Alterações nesta política',
        paragraphs: [
          'Se alterarmos esta política, publicaremos a nova versão nesta página com a respectiva data. Se a alteração for importante, avisaremos você por e-mail.',
        ],
      },
    ],
  },
};

function linkifyEmail(text: string) {
  const parts = text.split(EMAIL);
  return parts.flatMap((part, index) =>
    index === 0
      ? [part]
      : [
          <a key={index} href={`mailto:${EMAIL}`} className="font-semibold underline underline-offset-2 title-accent">
            {EMAIL}
          </a>,
          part,
        ],
  );
}

export function PrivacyPolicy() {
  const { language, setLanguage } = useLanguage();
  const copy = PRIVACY_POLICY_COPY[language];

  return (
    <main lang={language} className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex min-h-11 items-center text-sm font-semibold title-accent hover:underline">
            ← {copy.back}
          </Link>
          <div role="group" aria-label={copy.languageLabel} className="flex gap-1">
            {SUPPORTED_LANGUAGES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLanguage(code)}
                aria-pressed={code === language}
                title={LANGUAGE_LABELS[code]}
                className={`min-h-11 min-w-11 rounded-md border px-2 text-xs font-semibold uppercase transition-colors ${
                  code === language
                    ? 'border-[var(--color-jazz-title-accent)] text-foreground'
                    : 'border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        <h1 className="mt-8 font-serif text-3xl font-bold sm:text-4xl">{copy.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{copy.updated}</p>
        <p className="mt-6 text-base leading-relaxed">{copy.intro}</p>

        {copy.sections.map((section) => (
          <section key={section.title} className="mt-8">
            <h2 className="font-serif text-xl font-semibold sm:text-2xl">{section.title}</h2>
            {section.lead?.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-relaxed text-foreground/90">{linkifyEmail(paragraph)}</p>
            ))}
            {section.items && (
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-foreground/90">
                {section.items.map((item) => <li key={item}>{linkifyEmail(item)}</li>)}
              </ul>
            )}
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph} className="mt-3 leading-relaxed text-foreground/90">{linkifyEmail(paragraph)}</p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
