'use client';

import type { SupportedLanguage } from '@/lib/language';
import { LEGAL_CONTACT_EMAIL, LEGAL_OWNER, LegalDocument, type LegalCopy } from './legal-document';

/** Keep in sync with the FAQ promise in components/landing/faq-footer.tsx. */
export const REFUND_GUARANTEE_DAYS = 30;

const EMAIL = LEGAL_CONTACT_EMAIL;
const OWNER = LEGAL_OWNER;
const DAYS = REFUND_GUARANTEE_DAYS;
const PRIVACY_URL = 'www.culturadeljazz.com/privacy';

export const TERMS_OF_SALE_COPY: Record<SupportedLanguage, LegalCopy> = {
  es: {
    back: 'Volver a La Cultura del Jazz',
    title: 'Condiciones de venta y uso',
    updated: 'Última actualización: 25 de noviembre de 2026',
    intro: 'Estas condiciones regulan la compra y el uso del curso online «La Cultura del Jazz» en www.culturadeljazz.com. Al crear una cuenta o comprar el curso, las aceptas.',
    languageLabel: 'Idioma',
    sections: [
      {
        title: '1. Quiénes somos',
        paragraphs: [
          `El curso lo ofrece ${OWNER} y lo imparte Enric Vázquez Ramonich. Puedes escribirnos a ${EMAIL}.`,
        ],
      },
      {
        title: '2. El curso',
        items: [
          'Al registrarte gratis tienes acceso a la primera lección.',
          'Con la compra del curso completo accedes a todas las lecciones en vídeo, los materiales en PDF, los cuestionarios y el certificado de finalización.',
          'Es un pago único: no hay suscripción ni cuotas periódicas.',
          'Accedes desde tu cuenta personal mientras el curso esté disponible en la plataforma. Si algún día dejáramos de ofrecerlo, te avisaríamos con antelación.',
        ],
      },
      {
        title: '3. Precio y pago',
        items: [
          'Puedes ver el precio del curso en tu cuenta antes de comprar. Los impuestos que correspondan según tu país (por ejemplo, el IVA) se calculan y se muestran en la página de pago antes de que confirmes.',
          'El pago lo procesa Dodo Payments, que actúa como vendedor registrado (Merchant of Record) y te envía el recibo de la compra. Nosotros no recibimos los datos de tu tarjeta.',
          'El acceso al curso completo se activa en cuanto se confirma el pago.',
        ],
      },
      {
        title: `4. Garantía de devolución de ${DAYS} días`,
        items: [
          `Si el curso no es lo que esperabas, puedes pedir la devolución del importe completo dentro de los ${DAYS} días siguientes a la compra, sin tener que dar explicaciones.`,
          `Para pedirla, escríbenos a ${EMAIL} desde el correo de tu cuenta.`,
          'Te devolvemos el dinero por el mismo medio de pago. El tiempo que tarde en aparecer depende de tu banco.',
          'Con la devolución se retira el acceso al curso completo; la primera lección gratuita sigue disponible.',
        ],
        paragraphs: [
          `Como consumidor en la Unión Europea tienes además un derecho de desistimiento de 14 días; nuestra garantía de ${DAYS} días lo incluye y lo amplía. Esta garantía no limita ningún derecho que te reconozca la ley.`,
        ],
      },
      {
        title: '5. Vales y códigos de descuento',
        items: [
          'Los vales y los códigos de descuento son de un solo uso salvo que se indique otra cosa, no se pueden canjear por dinero y pueden tener fecha de caducidad.',
          'Si un vale te da el curso gratis, no hay ningún importe que devolver.',
        ],
      },
      {
        title: '6. Uso permitido',
        items: [
          'Tu cuenta es personal: no compartas tu acceso con otras personas.',
          'Los vídeos, textos, PDFs y demás materiales están protegidos por derechos de autor. Puedes usarlos para tu aprendizaje personal, pero no copiarlos para terceros, redistribuirlos, venderlos ni publicarlos.',
          'Podemos suspender una cuenta que se use para compartir o redistribuir el contenido.',
        ],
      },
      {
        title: '7. Certificado',
        paragraphs: [
          'El certificado de finalización reconoce que has completado el curso. No es un título oficial ni una acreditación académica.',
        ],
      },
      {
        title: '8. Disponibilidad',
        paragraphs: [
          'Trabajamos para que la web esté siempre disponible, pero puede haber interrupciones puntuales por mantenimiento o por causas ajenas a nosotros. Si algo te impide usar el curso, escríbenos y lo resolveremos.',
        ],
      },
      {
        title: '9. Tus datos personales',
        paragraphs: [
          `Tratamos tus datos según nuestra política de privacidad: ${PRIVACY_URL}.`,
        ],
      },
      {
        title: '10. Cambios en estas condiciones',
        paragraphs: [
          'Podemos actualizar estas condiciones. La versión publicada en esta página, con su fecha, es la vigente; cada compra se rige por las condiciones vigentes en el momento en que se hizo.',
        ],
      },
      {
        title: '11. Dudas y reclamaciones',
        paragraphs: [
          `Para cualquier duda o reclamación, escríbenos a ${EMAIL} y te responderemos lo antes posible. Nada en estas condiciones limita los derechos que te reconoce la normativa de protección de los consumidores de tu país de residencia.`,
        ],
      },
    ],
  },
  en: {
    back: 'Back to La Cultura del Jazz',
    title: 'Terms of sale and use',
    updated: 'Last updated: November 25, 2026',
    intro: 'These terms govern the purchase and use of the online course “La Cultura del Jazz” at www.culturadeljazz.com. By creating an account or buying the course, you accept them.',
    languageLabel: 'Language',
    sections: [
      {
        title: '1. Who we are',
        paragraphs: [
          `The course is offered by ${OWNER} and taught by Enric Vázquez Ramonich. You can write to us at ${EMAIL}.`,
        ],
      },
      {
        title: '2. The course',
        items: [
          'Registering for free gives you access to the first lesson.',
          'Buying the full course gives you all the video lessons, PDF materials, quizzes and the certificate of completion.',
          'It is a one-time payment: there is no subscription and no recurring fee.',
          'You access it from your personal account for as long as the course is available on the platform. If we ever stop offering it, we will let you know in advance.',
        ],
      },
      {
        title: '3. Price and payment',
        items: [
          'You can see the price of the course in your account before buying. Any taxes that apply in your country (such as VAT) are calculated and shown on the payment page before you confirm.',
          'Payment is processed by Dodo Payments, which acts as Merchant of Record and sends you the purchase receipt. We never receive your card details.',
          'Access to the full course is activated as soon as the payment is confirmed.',
        ],
      },
      {
        title: `4. ${DAYS}-day money-back guarantee`,
        items: [
          `If the course is not what you expected, you can ask for a full refund within ${DAYS} days of purchase, no questions asked.`,
          `To ask for it, write to ${EMAIL} from your account’s email address.`,
          'We refund the money to the same payment method. How long it takes to appear depends on your bank.',
          'A refund removes access to the full course; the free first lesson remains available.',
        ],
        paragraphs: [
          `As a consumer in the European Union you also have a 14-day right of withdrawal; our ${DAYS}-day guarantee includes and extends it. This guarantee does not limit any of your statutory rights.`,
        ],
      },
      {
        title: '5. Vouchers and discount codes',
        items: [
          'Vouchers and discount codes can be used once unless stated otherwise, cannot be exchanged for cash and may have an expiry date.',
          'If a voucher gives you the course for free, there is no amount to refund.',
        ],
      },
      {
        title: '6. Permitted use',
        items: [
          'Your account is personal: do not share your access with other people.',
          'Videos, texts, PDFs and other materials are protected by copyright. You may use them for your own learning, but not copy them for others, redistribute, sell or publish them.',
          'We may suspend an account that is used to share or redistribute the content.',
        ],
      },
      {
        title: '7. Certificate',
        paragraphs: [
          'The certificate of completion recognises that you have finished the course. It is not an official qualification or academic accreditation.',
        ],
      },
      {
        title: '8. Availability',
        paragraphs: [
          'We work to keep the site available at all times, but there may be occasional interruptions for maintenance or for reasons beyond our control. If something stops you from using the course, write to us and we will sort it out.',
        ],
      },
      {
        title: '9. Your personal data',
        paragraphs: [
          `We handle your data according to our privacy policy: ${PRIVACY_URL}.`,
        ],
      },
      {
        title: '10. Changes to these terms',
        paragraphs: [
          'We may update these terms. The version published on this page, with its date, is the one in force; each purchase is governed by the terms in force when it was made.',
        ],
      },
      {
        title: '11. Questions and complaints',
        paragraphs: [
          `For any question or complaint, write to ${EMAIL} and we will reply as soon as possible. Nothing in these terms limits the rights you have under the consumer protection law of your country of residence.`,
        ],
      },
    ],
  },
  fr: {
    back: 'Retour à La Cultura del Jazz',
    title: 'Conditions de vente et d’utilisation',
    updated: 'Dernière mise à jour : 25 novembre 2026',
    intro: 'Ces conditions régissent l’achat et l’utilisation du cours en ligne « La Cultura del Jazz » sur www.culturadeljazz.com. En créant un compte ou en achetant le cours, vous les acceptez.',
    languageLabel: 'Langue',
    sections: [
      {
        title: '1. Qui sommes-nous',
        paragraphs: [
          `Le cours est proposé par ${OWNER} et donné par Enric Vázquez Ramonich. Vous pouvez nous écrire à ${EMAIL}.`,
        ],
      },
      {
        title: '2. Le cours',
        items: [
          'L’inscription gratuite vous donne accès à la première leçon.',
          'L’achat du cours complet vous donne accès à toutes les leçons vidéo, aux supports PDF, aux quiz et au certificat de fin de cours.',
          'C’est un paiement unique : il n’y a ni abonnement ni frais récurrents.',
          'Vous y accédez depuis votre compte personnel tant que le cours est disponible sur la plateforme. Si nous cessions un jour de le proposer, nous vous préviendrions à l’avance.',
        ],
      },
      {
        title: '3. Prix et paiement',
        items: [
          'Vous pouvez voir le prix du cours dans votre compte avant l’achat. Les taxes applicables dans votre pays (comme la TVA) sont calculées et affichées sur la page de paiement avant votre confirmation.',
          'Le paiement est traité par Dodo Payments, qui agit en tant que vendeur officiel (Merchant of Record) et vous envoie le reçu d’achat. Nous ne recevons jamais les données de votre carte.',
          'L’accès au cours complet est activé dès la confirmation du paiement.',
        ],
      },
      {
        title: `4. Garantie de remboursement de ${DAYS} jours`,
        items: [
          `Si le cours ne correspond pas à vos attentes, vous pouvez demander le remboursement intégral dans les ${DAYS} jours suivant l’achat, sans avoir à vous justifier.`,
          `Pour le demander, écrivez à ${EMAIL} depuis l’adresse e-mail de votre compte.`,
          'Nous remboursons par le même moyen de paiement. Le délai d’apparition dépend de votre banque.',
          'Le remboursement retire l’accès au cours complet ; la première leçon gratuite reste disponible.',
        ],
        paragraphs: [
          `En tant que consommateur dans l’Union européenne, vous disposez en outre d’un droit de rétractation de 14 jours ; notre garantie de ${DAYS} jours l’inclut et l’étend. Cette garantie ne limite aucun de vos droits légaux.`,
        ],
      },
      {
        title: '5. Bons et codes de réduction',
        items: [
          'Les bons et codes de réduction sont à usage unique sauf indication contraire, ne sont pas échangeables contre de l’argent et peuvent avoir une date d’expiration.',
          'Si un bon vous donne le cours gratuitement, il n’y a aucun montant à rembourser.',
        ],
      },
      {
        title: '6. Utilisation autorisée',
        items: [
          'Votre compte est personnel : ne partagez pas votre accès avec d’autres personnes.',
          'Les vidéos, textes, PDF et autres supports sont protégés par le droit d’auteur. Vous pouvez les utiliser pour votre apprentissage personnel, mais pas les copier pour des tiers, les redistribuer, les vendre ni les publier.',
          'Nous pouvons suspendre un compte utilisé pour partager ou redistribuer le contenu.',
        ],
      },
      {
        title: '7. Certificat',
        paragraphs: [
          'Le certificat de fin de cours atteste que vous avez terminé le cours. Ce n’est ni un diplôme officiel ni une accréditation académique.',
        ],
      },
      {
        title: '8. Disponibilité',
        paragraphs: [
          'Nous faisons en sorte que le site soit toujours disponible, mais des interruptions ponctuelles peuvent survenir pour maintenance ou pour des raisons indépendantes de notre volonté. Si quelque chose vous empêche d’utiliser le cours, écrivez-nous et nous réglerons le problème.',
        ],
      },
      {
        title: '9. Vos données personnelles',
        paragraphs: [
          `Nous traitons vos données conformément à notre politique de confidentialité : ${PRIVACY_URL}.`,
        ],
      },
      {
        title: '10. Modifications de ces conditions',
        paragraphs: [
          'Nous pouvons mettre à jour ces conditions. La version publiée sur cette page, avec sa date, est celle en vigueur ; chaque achat est régi par les conditions en vigueur au moment où il a été effectué.',
        ],
      },
      {
        title: '11. Questions et réclamations',
        paragraphs: [
          `Pour toute question ou réclamation, écrivez à ${EMAIL} et nous vous répondrons dans les meilleurs délais. Rien dans ces conditions ne limite les droits que vous confère la législation de protection des consommateurs de votre pays de résidence.`,
        ],
      },
    ],
  },
  pt: {
    back: 'Voltar para La Cultura del Jazz',
    title: 'Condições de venda e uso',
    updated: 'Última atualização: 25 de novembro de 2026',
    intro: 'Estas condições regulam a compra e o uso do curso online “La Cultura del Jazz” em www.culturadeljazz.com. Ao criar uma conta ou comprar o curso, você as aceita.',
    languageLabel: 'Idioma',
    sections: [
      {
        title: '1. Quem somos',
        paragraphs: [
          `O curso é oferecido por ${OWNER} e ministrado por Enric Vázquez Ramonich. Você pode nos escrever em ${EMAIL}.`,
        ],
      },
      {
        title: '2. O curso',
        items: [
          'Ao se registrar gratuitamente, você tem acesso à primeira aula.',
          'Com a compra do curso completo, você acessa todas as aulas em vídeo, os materiais em PDF, os questionários e o certificado de conclusão.',
          'É um pagamento único: não há assinatura nem cobranças periódicas.',
          'Você acessa pela sua conta pessoal enquanto o curso estiver disponível na plataforma. Se algum dia deixarmos de oferecê-lo, avisaremos com antecedência.',
        ],
      },
      {
        title: '3. Preço e pagamento',
        items: [
          'Você pode ver o preço do curso na sua conta antes de comprar. Os impostos aplicáveis no seu país (como o IVA) são calculados e mostrados na página de pagamento antes da sua confirmação.',
          'O pagamento é processado pela Dodo Payments, que atua como vendedor registrado (Merchant of Record) e lhe envia o recibo da compra. Nós nunca recebemos os dados do seu cartão.',
          'O acesso ao curso completo é ativado assim que o pagamento é confirmado.',
        ],
      },
      {
        title: `4. Garantia de reembolso de ${DAYS} dias`,
        items: [
          `Se o curso não for o que você esperava, pode pedir o reembolso integral em até ${DAYS} dias após a compra, sem precisar dar explicações.`,
          `Para pedir, escreva para ${EMAIL} a partir do e-mail da sua conta.`,
          'Devolvemos o dinheiro pelo mesmo meio de pagamento. O prazo para aparecer depende do seu banco.',
          'Com o reembolso, o acesso ao curso completo é retirado; a primeira aula gratuita continua disponível.',
        ],
        paragraphs: [
          `Como consumidor na União Europeia, você tem ainda um direito de arrependimento de 14 dias; a nossa garantia de ${DAYS} dias o inclui e o amplia. Esta garantia não limita nenhum direito que a lei lhe reconheça.`,
        ],
      },
      {
        title: '5. Vales e códigos de desconto',
        items: [
          'Os vales e códigos de desconto são de uso único, salvo indicação em contrário, não podem ser trocados por dinheiro e podem ter data de validade.',
          'Se um vale lhe der o curso gratuitamente, não há valor a reembolsar.',
        ],
      },
      {
        title: '6. Uso permitido',
        items: [
          'Sua conta é pessoal: não compartilhe seu acesso com outras pessoas.',
          'Os vídeos, textos, PDFs e demais materiais são protegidos por direitos autorais. Você pode usá-los para a sua aprendizagem pessoal, mas não copiá-los para terceiros, redistribuí-los, vendê-los ou publicá-los.',
          'Podemos suspender uma conta usada para compartilhar ou redistribuir o conteúdo.',
        ],
      },
      {
        title: '7. Certificado',
        paragraphs: [
          'O certificado de conclusão reconhece que você concluiu o curso. Não é um diploma oficial nem uma acreditação acadêmica.',
        ],
      },
      {
        title: '8. Disponibilidade',
        paragraphs: [
          'Trabalhamos para que o site esteja sempre disponível, mas pode haver interrupções pontuais por manutenção ou por motivos alheios a nós. Se algo impedir você de usar o curso, escreva-nos e resolveremos.',
        ],
      },
      {
        title: '9. Seus dados pessoais',
        paragraphs: [
          `Tratamos seus dados de acordo com a nossa política de privacidade: ${PRIVACY_URL}.`,
        ],
      },
      {
        title: '10. Alterações nestas condições',
        paragraphs: [
          'Podemos atualizar estas condições. A versão publicada nesta página, com a respectiva data, é a vigente; cada compra é regida pelas condições vigentes no momento em que foi feita.',
        ],
      },
      {
        title: '11. Dúvidas e reclamações',
        paragraphs: [
          `Para qualquer dúvida ou reclamação, escreva para ${EMAIL} e responderemos o mais rápido possível. Nada nestas condições limita os direitos que a legislação de proteção ao consumidor do seu país de residência lhe reconhece.`,
        ],
      },
    ],
  },
};

export function TermsOfSale() {
  return <LegalDocument copyByLanguage={TERMS_OF_SALE_COPY} />;
}
