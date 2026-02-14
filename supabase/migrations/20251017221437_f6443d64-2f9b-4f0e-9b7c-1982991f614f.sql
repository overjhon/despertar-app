-- Create installation badge with correct category
INSERT INTO public.badges (
  name,
  description,
  icon,
  category,
  xp_reward,
  criteria
) VALUES (
  'Instalador',
  'Instalou o app no dispositivo',
  'smartphone',
  'special',
  100,
  '{"action": "install_app"}'::jsonb
) ON CONFLICT DO NOTHING;