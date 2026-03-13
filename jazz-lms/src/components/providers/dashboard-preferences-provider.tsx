'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/components/providers/language-provider';

export type DashboardLanguage = 'en' | 'pt' | 'es' | 'fr';

interface NotificationSettings {
  emailNotifications: boolean;
  courseUpdates: boolean;
  progressReminders: boolean;
}

interface DashboardPreferencesState {
  notifications: NotificationSettings;
}

interface DashboardPreferencesContextValue {
  language: DashboardLanguage;
  setLanguage: (language: DashboardLanguage) => void;
  notifications: NotificationSettings;
  setNotifications: (notifications: NotificationSettings) => void;
  updateNotification: <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => void;
  t: (key: string, fallback: string) => string;
}

const STORAGE_KEY = 'jazz-dashboard-preferences-v1';

const defaultState: DashboardPreferencesState = {
  notifications: {
    emailNotifications: true,
    courseUpdates: true,
    progressReminders: false,
  },
};

const translations: Record<DashboardLanguage, Record<string, string>> = {
  en: {
    lobby: 'Lobby',
    myCourses: 'My Courses',
    messages: 'Messages',
    courseNotes: 'Course Notes',
    myNotes: 'My Notes',
    lessonNotes: 'Lesson notes',
    writeNotesForSelectedClass: 'Write notes for selected class...',
    classLabel: 'Class',
    settings: 'Settings',
    courses: 'Courses',
    logOut: 'Log out',
    loading: 'Loading…',
    noNotifications: 'No notifications',
    noPurchasedCoursesYet: 'No purchased courses yet.',
    settingsTitle: 'Settings',
    settingsSubtitle: 'Customize your experience',
    appearance: 'Appearance',
    notifications: 'Notifications',
    language: 'Language',
    dark: 'Dark',
    light: 'Light',
    system: 'System',
    darkDesc: 'Dark background with light text',
    lightDesc: 'Light background with dark text',
    systemDesc: 'Follow system preferences',
    emailNotifications: 'Email notifications',
    emailNotificationsDesc: 'Get updates about new courses and promotions',
    courseUpdates: 'Course updates',
    courseUpdatesDesc: 'Get notified when your courses have new content',
    progressReminders: 'Progress reminders',
    progressRemindersDesc: 'Receive reminders to keep learning',
    myCoursesSubtitle: '15 real classes, organized in pages of 5',
    watched: 'Watched',
    inProgress: 'In progress',
    notStarted: 'Not started',
    totalClasses: 'Total classes',
    completionRate: 'Completion rate',
    courseClasses: 'Course classes',
    showingFivePerPage: 'Showing 5 classes per page in official order',
    page: 'Page',
    of: 'of',
    previous: 'Previous',
    next: 'Next',
    locked: 'Locked',
    purchaseRequired: 'Purchase required',
    minLeft: 'min left',
    introductionToJazzMusic: 'Introduction to Jazz Music',
    clickAnyClassStart: 'Click any class to see the full description and start watching',
    classOneFreePreview: 'Class 1 is free — Click any class to preview content',
    readyUnlock: 'Ready to unlock all 15 classes?',
    welcomeShort: 'Welcome,',
    inboxNewMessageTitle: 'New inbox message',
    inboxNewMessagePreview: 'You have unread messages in your inbox.',
    now: 'Now',
    newItems: 'new',
    adminPanel: 'Admin panel',
    profile: 'Profile',
    paymentHistory: 'Payment history',
    platinumMedals: 'platinum medals',
    supremeMedalPage: 'Jazz specialist medal',
    close: 'Close',
    userFallback: 'User',
  },
  pt: {
    lobby: 'Lobby',
    myCourses: 'Meus Cursos',
    messages: 'Mensagens',
    courseNotes: 'Notas do Curso',
    myNotes: 'Minhas Notas',
    lessonNotes: 'Notas da aula',
    writeNotesForSelectedClass: 'Escreva notas para a aula selecionada...',
    classLabel: 'Aula',
    settings: 'Configurações',
    courses: 'Cursos',
    logOut: 'Sair',
    loading: 'Carregando…',
    noNotifications: 'Sem notificações',
    noPurchasedCoursesYet: 'Nenhum curso comprado ainda.',
    settingsTitle: 'Configurações',
    settingsSubtitle: 'Personalize sua experiência',
    appearance: 'Aparência',
    notifications: 'Notificações',
    language: 'Idioma',
    dark: 'Escuro',
    light: 'Claro',
    system: 'Sistema',
    darkDesc: 'Fundo escuro com texto claro',
    lightDesc: 'Fundo claro com texto escuro',
    systemDesc: 'Seguir preferências do sistema',
    emailNotifications: 'Notificações por email',
    emailNotificationsDesc: 'Receba atualizações sobre novos cursos e promoções',
    courseUpdates: 'Atualizações de curso',
    courseUpdatesDesc: 'Seja avisado quando seus cursos tiverem novo conteúdo',
    progressReminders: 'Lembretes de progresso',
    progressRemindersDesc: 'Receba lembretes para continuar aprendendo',
    myCoursesSubtitle: '15 aulas reais, organizadas em páginas de 5',
    watched: 'Assistido',
    inProgress: 'Em progresso',
    notStarted: 'Não iniciado',
    totalClasses: 'Total de aulas',
    completionRate: 'Taxa de conclusão',
    courseClasses: 'Aulas do curso',
    showingFivePerPage: 'Mostrando 5 aulas por página na ordem oficial',
    page: 'Página',
    of: 'de',
    previous: 'Anterior',
    next: 'Próxima',
    locked: 'Bloqueado',
    purchaseRequired: 'Compra necessária',
    minLeft: 'min restantes',
    introductionToJazzMusic: 'Introdução à Música Jazz',
    clickAnyClassStart: 'Clique em qualquer aula para ver a descrição completa e começar a assistir',
    classOneFreePreview: 'A aula 1 é grátis — Clique em qualquer aula para visualizar o conteúdo',
    readyUnlock: 'Pronto para desbloquear as 15 aulas?',
    welcomeShort: 'Bem-vindo,',
    inboxNewMessageTitle: 'Nova mensagem na caixa de entrada',
    inboxNewMessagePreview: 'Você tem mensagens não lidas na sua caixa de entrada.',
    now: 'Agora',
    newItems: 'novas',
    adminPanel: 'Painel de administração',
    profile: 'Perfil',
    paymentHistory: 'Histórico de pagamentos',
    platinumMedals: 'medalhas de platina',
    supremeMedalPage: 'Medalha de especialista em jazz',
    close: 'Fechar',
    userFallback: 'Usuário',
  },
  es: {
    lobby: 'Lobby',
    myCourses: 'Mis Cursos',
    messages: 'Mensajes',
    courseNotes: 'Notas del Curso',
    myNotes: 'Mis Notas',
    lessonNotes: 'Notas de la clase',
    writeNotesForSelectedClass: 'Escribe notas para la clase seleccionada...',
    classLabel: 'Clase',
    settings: 'Configuración',
    courses: 'Cursos',
    logOut: 'Cerrar sesión',
    loading: 'Cargando…',
    noNotifications: 'Sin notificaciones',
    noPurchasedCoursesYet: 'Aún no hay cursos comprados.',
    settingsTitle: 'Configuración',
    settingsSubtitle: 'Personaliza tu experiencia',
    appearance: 'Apariencia',
    notifications: 'Notificaciones',
    language: 'Idioma',
    dark: 'Oscuro',
    light: 'Claro',
    system: 'Sistema',
    darkDesc: 'Fondo oscuro con texto claro',
    lightDesc: 'Fondo claro con texto oscuro',
    systemDesc: 'Seguir preferencias del sistema',
    emailNotifications: 'Notificaciones por correo',
    emailNotificationsDesc: 'Recibe novedades sobre nuevos cursos y promociones',
    courseUpdates: 'Actualizaciones del curso',
    courseUpdatesDesc: 'Recibe avisos cuando tus cursos tengan contenido nuevo',
    progressReminders: 'Recordatorios de progreso',
    progressRemindersDesc: 'Recibe recordatorios para continuar aprendiendo',
    myCoursesSubtitle: '15 clases reales, organizadas en páginas de 5',
    watched: 'Visto',
    inProgress: 'En progreso',
    notStarted: 'Sin empezar',
    totalClasses: 'Total de clases',
    completionRate: 'Tasa de finalización',
    courseClasses: 'Clases del curso',
    showingFivePerPage: 'Mostrando 5 clases por página en orden oficial',
    page: 'Página',
    of: 'de',
    previous: 'Anterior',
    next: 'Siguiente',
    locked: 'Bloqueado',
    purchaseRequired: 'Compra necesaria',
    minLeft: 'min restantes',
    introductionToJazzMusic: 'Introducción a la Música Jazz',
    clickAnyClassStart: 'Haz clic en cualquier clase para ver la descripción completa y empezar a mirar',
    classOneFreePreview: 'La clase 1 es gratis — Haz clic en cualquier clase para previsualizar su contenido',
    readyUnlock: '¿Listo para desbloquear las 15 clases?',
    welcomeShort: 'Bienvenido,',
    inboxNewMessageTitle: 'Nuevo mensaje en la bandeja',
    inboxNewMessagePreview: 'Tienes mensajes sin leer en tu bandeja.',
    now: 'Ahora',
    newItems: 'nuevas',
    adminPanel: 'Panel de administración',
    profile: 'Perfil',
    paymentHistory: 'Historial de pagos',
    platinumMedals: 'medallas de platino',
    supremeMedalPage: 'Medalla de especialista en jazz',
    close: 'Cerrar',
    userFallback: 'Usuario',
  },
  fr: {
    lobby: 'Accueil',
    myCourses: 'Mes Cours',
    messages: 'Messages',
    courseNotes: 'Notes du Cours',
    myNotes: 'Mes Notes',
    lessonNotes: 'Notes de cours',
    writeNotesForSelectedClass: 'Écrivez des notes pour la classe sélectionnée...',
    classLabel: 'Cours',
    settings: 'Paramètres',
    courses: 'Cours',
    logOut: 'Se déconnecter',
    loading: 'Chargement…',
    noNotifications: 'Aucune notification',
    noPurchasedCoursesYet: 'Aucun cours acheté pour le moment.',
    settingsTitle: 'Paramètres',
    settingsSubtitle: 'Personnalisez votre expérience',
    appearance: 'Apparence',
    notifications: 'Notifications',
    language: 'Langue',
    dark: 'Sombre',
    light: 'Clair',
    system: 'Système',
    darkDesc: 'Fond sombre avec texte clair',
    lightDesc: 'Fond clair avec texte sombre',
    systemDesc: 'Suivre les préférences du système',
    emailNotifications: 'Notifications e-mail',
    emailNotificationsDesc: 'Recevez des mises à jour sur les nouveaux cours et promotions',
    courseUpdates: 'Mises à jour des cours',
    courseUpdatesDesc: 'Soyez informé quand vos cours ont du nouveau contenu',
    progressReminders: 'Rappels de progression',
    progressRemindersDesc: 'Recevez des rappels pour continuer à apprendre',
    myCoursesSubtitle: '15 vraies classes, organisées par pages de 5',
    watched: 'Regardé',
    inProgress: 'En cours',
    notStarted: 'Pas commencé',
    totalClasses: 'Total des classes',
    completionRate: 'Taux de complétion',
    courseClasses: 'Classes du cours',
    showingFivePerPage: 'Affichage de 5 classes par page dans l’ordre officiel',
    page: 'Page',
    of: 'de',
    previous: 'Précédent',
    next: 'Suivant',
    locked: 'Verrouillé',
    purchaseRequired: 'Achat requis',
    minLeft: 'min restantes',
    introductionToJazzMusic: 'Introduction à la Musique Jazz',
    clickAnyClassStart: 'Cliquez sur une classe pour voir la description complète et commencer à regarder',
    classOneFreePreview: 'La classe 1 est gratuite — Cliquez sur une classe pour prévisualiser son contenu',
    readyUnlock: 'Prêt à débloquer les 15 classes ?',
    welcomeShort: 'Bienvenue,',
    inboxNewMessageTitle: 'Nouveau message dans la boîte de réception',
    inboxNewMessagePreview: 'Vous avez des messages non lus dans votre boîte de réception.',
    now: 'Maintenant',
    newItems: 'nouveaux',
    adminPanel: 'Panneau d’administration',
    profile: 'Profil',
    paymentHistory: 'Historique des paiements',
    platinumMedals: 'medailles platine',
    supremeMedalPage: 'Medaille de specialiste du jazz',
    close: 'Fermer',
    userFallback: 'Utilisateur',
  },
};

const DashboardPreferencesContext = createContext<DashboardPreferencesContextValue | null>(null);

export function DashboardPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<DashboardPreferencesState>(defaultState);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DashboardPreferencesState;
        setState({
          notifications: {
            ...defaultState.notifications,
            ...(parsed.notifications ?? {}),
          },
        });
      }
    } catch {
      setState(defaultState);
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, isReady]);

  const { language, setLanguage } = useLanguage();

  const value = useMemo<DashboardPreferencesContextValue>(
    () => ({
      language,
      setLanguage,
      notifications: state.notifications,
      setNotifications: (notifications) => setState((prev) => ({ ...prev, notifications })),
      updateNotification: (key, value) =>
        setState((prev) => ({
          ...prev,
          notifications: {
            ...prev.notifications,
            [key]: value,
          },
        })),
      t: (key, fallback) => translations[language][key] ?? fallback,
    }),
    [language, setLanguage, state]
  );

  return (
    <DashboardPreferencesContext.Provider value={value}>
      {children}
    </DashboardPreferencesContext.Provider>
  );
}

export function useDashboardPreferences() {
  const context = useContext(DashboardPreferencesContext);
  if (!context) {
    throw new Error('useDashboardPreferences must be used within DashboardPreferencesProvider');
  }
  return context;
}
