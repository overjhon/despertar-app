-- Add community badges
INSERT INTO public.badges (name, description, icon, category, xp_reward, criteria) VALUES
('Comunicador', 'Poste 10 depoimentos', '💬', 'community', 250, '{"type": "testimonials_posted", "count": 10}'),
('Influenciador', 'Receba 100 curtidas totais', '⭐', 'community', 500, '{"type": "total_likes_received", "count": 100}')
ON CONFLICT DO NOTHING;