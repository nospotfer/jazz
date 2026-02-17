'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    {
      value: 'dark',
      label: 'Dark',
      description: 'Dark background with light text',
      icon: Moon,
    },
    {
      value: 'light',
      label: 'Light',
      description: 'Light background with dark text',
      icon: Sun,
    },
    {
      value: 'system',
      label: 'System',
      description: 'Follow your system preferences',
      icon: Monitor,
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Customize your experience
        </p>
      </div>

      {/* Appearance */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Appearance
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
                    : 'border-border hover:border-primary/20 hover:bg-accent text-muted-foreground'
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
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Notifications
        </h2>
        <div className="space-y-4">
          <ToggleSetting
            label="Email Notifications"
            description="Receive updates about new courses and promotions"
            defaultChecked
          />
          <ToggleSetting
            label="Course Updates"
            description="Get notified when courses you're enrolled in have new content"
            defaultChecked
          />
          <ToggleSetting
            label="Progress Reminders"
            description="Receive reminders to continue your learning"
          />
        </div>
      </div>

      {/* Language */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Language
        </h2>
        <select className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50">
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
  defaultChecked = false,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          defaultChecked={defaultChecked}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
      </label>
    </div>
  );
}
