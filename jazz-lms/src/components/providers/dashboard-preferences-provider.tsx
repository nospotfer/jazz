'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type DashboardLanguage = 'en' | 'pt' | 'es' | 'fr';

interface NotificationSettings {
  emailNotifications: boolean;
  courseUpdates: boolean;
  progressReminders: boolean;
}

interface DashboardPreferencesState {
  language: DashboardLanguage;
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
  language: 'en',
  notifications: {
    emailNotifications: true,
    courseUpdates: true,
    progressReminders: false,
  },
};

const translations: Record<DashboardLanguage, Record<string, string>> = {
  en: {},
  pt: {
    lobby: 'Lobby',
    myCourses: 'Meus Cursos',
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
  },
  es: {
    lobby: 'Lobby',
    myCourses: 'Mis Cursos',
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
  },
  fr: {
    lobby: 'Accueil',
    myCourses: 'Mes Cours',
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
          language: parsed.language ?? defaultState.language,
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

  useEffect(() => {
    document.documentElement.lang = state.language;
  }, [state.language]);

  const value = useMemo<DashboardPreferencesContextValue>(
    () => ({
      language: state.language,
      setLanguage: (language) => setState((prev) => ({ ...prev, language })),
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
      t: (key, fallback) => translations[state.language]?.[key] ?? fallback,
    }),
    [state]
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
