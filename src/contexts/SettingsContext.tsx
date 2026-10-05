import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface SiteSettings {
  institutionName: string;
  institutionAbbreviation: string;
  institutionSubtitle: string;
  supportEmail: string;
  systemLanguage: string;
  primaryColor: 'blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'indigo';
  themeMode: 'light' | 'dark';
  gamificationEnabled: boolean;
  pointsForSubmission: number;
  pointsForApproval: number;
  pointsForCompletion: number;
  autoApproveKaizens: boolean;
  requireApprovalForRegister: boolean;
  currencySymbol: string;
  allowEmployeeKaizenDelete: boolean;
  enableEmailNotifications: boolean;
  maxImageUploadMB: number;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  institutionName: 'Sodecia Kaizen',
  institutionAbbreviation: 'SOD',
  institutionSubtitle: 'Programa de Ideias e Melhoria Contínua',
  supportEmail: 'kaizen@sodecia.com',
  systemLanguage: 'pt-BR',
  primaryColor: 'blue',
  themeMode: 'light',
  gamificationEnabled: true,
  pointsForSubmission: 10,
  pointsForApproval: 50,
  pointsForCompletion: 100,
  autoApproveKaizens: false,
  requireApprovalForRegister: false,
  currencySymbol: 'R$',
  allowEmployeeKaizenDelete: false,
  enableEmailNotifications: true,
  maxImageUploadMB: 5,
};

const STORAGE_KEY = 'kaizen_site_settings';

interface SettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<{ error: Error | null }>;
  toggleThemeMode: () => Promise<void>;
  resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const COLOR_PALETTES: Record<string, Record<string, string>> = {
  blue: {
    '50': '#eff6ff',
    '100': '#dbeafe',
    '500': '#3b82f6',
    '600': '#2563eb',
    '700': '#1d4ed8',
    '800': '#1e40af',
    '900': '#1e3a8a',
  },
  emerald: {
    '50': '#ecfdf5',
    '100': '#d1fae5',
    '500': '#10b981',
    '600': '#059669',
    '700': '#047857',
    '800': '#065f46',
    '900': '#064e3b',
  },
  violet: {
    '50': '#f5f3ff',
    '100': '#ede9fe',
    '500': '#8b5cf6',
    '600': '#7c3aed',
    '700': '#6d28d9',
    '800': '#5b21b6',
    '900': '#4c1d95',
  },
  amber: {
    '50': '#fffbeb',
    '100': '#fef3c7',
    '500': '#f59e0b',
    '600': '#d97706',
    '700': '#b45309',
    '800': '#92400e',
    '900': '#78350f',
  },
  rose: {
    '50': '#fff1f2',
    '100': '#ffe4e6',
    '500': '#f43f5e',
    '600': '#e11d48',
    '700': '#be123c',
    '800': '#9f1239',
    '900': '#881337',
  },
  indigo: {
    '50': '#eef2ff',
    '100': '#e0e7ff',
    '500': '#6366f1',
    '600': '#4f46e5',
    '700': '#4338ca',
    '800': '#3730a3',
    '900': '#312e81',
  },
};

export function applyPrimaryColorCSS(colorName: string) {
  const palette = COLOR_PALETTES[colorName] || COLOR_PALETTES.blue;
  Object.entries(palette).forEach(([shade, hex]) => {
    document.documentElement.style.setProperty(`--primary-${shade}`, hex);
  });
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.primaryColor) applyPrimaryColorCSS(parsed.primaryColor);
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        console.error('Failed to parse cached settings:', e);
      }
    }
    applyPrimaryColorCSS(DEFAULT_SETTINGS.primaryColor);
    return DEFAULT_SETTINGS;
  });
  const [loading, setLoading] = useState(true);

  // Apply dark mode class and primary color on html tag whenever settings change
  useEffect(() => {
    if (settings.themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    applyPrimaryColorCSS(settings.primaryColor || 'blue');
  }, [settings.themeMode, settings.primaryColor]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('settings')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data && data.settings) {
        const mergedSettings = { ...DEFAULT_SETTINGS, ...data.settings };
        setSettings(mergedSettings);
        applyPrimaryColorCSS(mergedSettings.primaryColor || 'blue');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedSettings));
      }
    } catch (err) {
      console.warn('Could not load site_settings from Supabase, using localStorage/defaults:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Immediately toggle HTML dark class and primary color CSS variables
    if (updated.themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    applyPrimaryColorCSS(updated.primaryColor || 'blue');

    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert(
          {
            id: 'default',
            settings: updated,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );

      if (error) {
        console.warn('Supabase site_settings table upsert error (saved locally):', error.message);
      }
      return { error: null };
    } catch (err) {
      console.warn('Failed to persist settings in Supabase DB (saved locally):', err);
      return { error: null };
    }
  };

  const toggleThemeMode = async () => {
    const nextMode = settings.themeMode === 'dark' ? 'light' : 'dark';
    await updateSettings({ themeMode: nextMode });
  };

  const resetSettings = async () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    document.documentElement.classList.remove('dark');
    try {
      await supabase
        .from('site_settings')
        .upsert(
          {
            id: 'default',
            settings: DEFAULT_SETTINGS,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        );
    } catch (err) {
      console.warn('Failed to reset settings in Supabase:', err);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, toggleThemeMode, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
