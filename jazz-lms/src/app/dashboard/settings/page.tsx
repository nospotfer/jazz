'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  useDashboardPreferences,
  type DashboardLanguage,
} from '@/components/providers/dashboard-preferences-provider';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const {
    t,
    language,
    setLanguage,
    notifications,
    updateNotification,
  } = useDashboardPreferences();

  const themeOptions = [
    {
      value: 'dark',
      label: t('dark', 'Dark'),
      description: t('darkDesc', 'Dark background with light text'),
      icon: Moon,
    },
    {
      value: 'light',
      label: t('light', 'Light'),
      description: t('lightDesc', 'Light background with dark text'),
      icon: Sun,
    },
    {
      value: 'system',
      label: t('system', 'System'),
      description: t('systemDesc', 'Follow your system preferences'),
      icon: Monitor,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-0.5 sm:px-0 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
          {t('settingsTitle', 'Settings')}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {t('settingsSubtitle', 'Customize your experience')}
        </p>
      </div>

      {/* Appearance */}
      <div className="bg-card border border-primary/40 hover:border-primary/70 transition-colors rounded-xl p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">
          {t('appearance', 'Appearance')}
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
          {t('notifications', 'Notifications')}
        </h2>
        <div className="space-y-4">
          <ToggleSetting
            label={t('emailNotifications', 'Email Notifications')}
            description={t(
              'emailNotificationsDesc',
              'Receive updates about new courses and promotions'
            )}
            checked={notifications.emailNotifications}
            onChange={(value) => updateNotification('emailNotifications', value)}
          />
          <ToggleSetting
            label={t('courseUpdates', 'Course Updates')}
            description={t(
              'courseUpdatesDesc',
              "Get notified when courses you're enrolled in have new content"
            )}
            checked={notifications.courseUpdates}
            onChange={(value) => updateNotification('courseUpdates', value)}
          />
          <ToggleSetting
            label={t('progressReminders', 'Progress Reminders')}
            description={t(
              'progressRemindersDesc',
              'Receive reminders to continue your learning'
            )}
            checked={notifications.progressReminders}
            onChange={(value) => updateNotification('progressReminders', value)}
          />
        </div>
      </div>

      {/* Language */}
      <div className="bg-card border border-primary/40 hover:border-primary/70 transition-colors rounded-xl p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-4">
          {t('language', 'Language')}
        </h2>
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value as DashboardLanguage)}
          className="w-full px-3 py-2.5 bg-background border border-primary/40 hover:border-primary/70 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/70 transition-colors"
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="pt">Português</option>
          <option value="fr">Français</option>
        </select>
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
