'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  useDashboardPreferences,
} from '@/components/providers/dashboard-preferences-provider';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const {
    t,
    notifications,
    updateNotification,
  } = useDashboardPreferences();

  const themeOptions = [
    {
      value: 'dark',
      label: t('dark', 'Oscuro'),
      description: t('darkDesc', 'Fondo oscuro con texto claro'),
      icon: Moon,
    },
    {
      value: 'light',
      label: t('light', 'Claro'),
      description: t('lightDesc', 'Fondo claro con texto oscuro'),
      icon: Sun,
    },
    {
      value: 'system',
      label: t('system', 'Sistema'),
      description: t('systemDesc', 'Seguir preferencias del sistema'),
      icon: Monitor,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-0.5 sm:px-0 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
          {t('settingsTitle', 'Configuración')}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {t('settingsSubtitle', 'Personaliza tu experiencia')}
        </p>
      </div>

      {/* Appearance */}
      <div className="bg-card border border-primary/40 hover:border-primary/70 transition-colors rounded-xl p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">
          {t('appearance', 'Apariencia')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-primary/10 border-primary/40 text-primary'
                    : 'border-primary/30 hover:border-primary/70 hover:bg-accent text-muted-foreground'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs text-center opacity-80">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card border border-primary/40 hover:border-primary/70 transition-colors rounded-xl p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">
          {t('notifications', 'Notificaciones')}
        </h2>
        <div className="space-y-4">
          <ToggleSetting
            label={t('emailNotifications', 'Notificaciones por correo')}
            description={t(
              'emailNotificationsDesc',
              'Recibe novedades sobre nuevos cursos y promociones'
            )}
            checked={notifications.emailNotifications}
            onChange={(value) => updateNotification('emailNotifications', value)}
          />
          <ToggleSetting
            label={t('courseUpdates', 'Actualizaciones del curso')}
            description={t(
              'courseUpdatesDesc',
              'Recibe avisos cuando tus cursos tengan contenido nuevo'
            )}
            checked={notifications.courseUpdates}
            onChange={(value) => updateNotification('courseUpdates', value)}
          />
          <ToggleSetting
            label={t('progressReminders', 'Recordatorios de progreso')}
            description={t(
              'progressRemindersDesc',
              'Recibe recordatorios para continuar aprendiendo'
            )}
            checked={notifications.progressReminders}
            onChange={(value) => updateNotification('progressReminders', value)}
          />
        </div>
      </div>

      {/* Language */}
      <div className="bg-card border border-primary/40 hover:border-primary/70 transition-colors rounded-xl p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">
          {t('language', 'Idioma')}
        </h2>
        <div className="w-full px-3 py-2.5 bg-background border border-primary/40 rounded-lg text-foreground">
          Español (predeterminado)
        </div>
      </div>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 pr-1">
        <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
      </label>
    </div>
  );
}
