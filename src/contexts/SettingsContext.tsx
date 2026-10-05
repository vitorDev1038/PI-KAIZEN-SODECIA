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

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
      } catch (e) {
        console.error('Failed to parse cached settings:', e);
      }
    }
    return DEFAULT_SETTINGS;
  });
  const [loading, setLoading] = useState(true);

  // Apply dark mode class on html tag whenever themeMode changes
  useEffect(() => {
    if (settings.themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.themeMode]);

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

    // Immediately toggle HTML dark class if themeMode changed
    if (updated.themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

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
