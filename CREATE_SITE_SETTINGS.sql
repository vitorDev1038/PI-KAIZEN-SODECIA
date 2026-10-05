-- Script para criar a tabela de configurações do site (site_settings)
-- Execute este script no SQL Editor do Supabase se desejar salvar as configurações no Banco de Dados

CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to site_settings for authenticated users" ON public.site_settings;
CREATE POLICY "Allow read access to site_settings for authenticated users"
  ON public.site_settings FOR SELECT
  TO authenticated
  USING (true);

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

SELECT * FROM public.site_settings;
