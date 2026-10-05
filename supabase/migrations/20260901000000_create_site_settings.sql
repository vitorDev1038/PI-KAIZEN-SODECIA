-- ============================================================================
-- MIGRATION: Create Site Settings Table for Institution Configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to all authenticated users
DROP POLICY IF EXISTS "Allow read access to site_settings for authenticated users" ON public.site_settings;
CREATE POLICY "Allow read access to site_settings for authenticated users"
  ON public.site_settings FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow write access to admins
DROP POLICY IF EXISTS "Allow update access to site_settings for admins" ON public.site_settings;
CREATE POLICY "Allow update access to site_settings for admins"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert default row if not existing
INSERT INTO public.site_settings (id, settings)
VALUES ('default', '{
  "institutionName": "Sodecia Kaizen",
  "institutionAbbreviation": "SOD",
  "institutionSubtitle": "Programa de Ideias e Melhoria Contínua",
  "supportEmail": "kaizen@sodecia.com",
  "systemLanguage": "pt-BR",
  "primaryColor": "blue",
  "gamificationEnabled": true,
  "pointsForSubmission": 10,
  "pointsForApproval": 50,
  "pointsForCompletion": 100,
  "autoApproveKaizens": false,
  "requireApprovalForRegister": false,
  "currencySymbol": "R$",
  "allowEmployeeKaizenDelete": false,
  "enableEmailNotifications": true,
  "maxImageUploadMB": 5
}'::jsonb)
ON CONFLICT (id) DO NOTHING;
