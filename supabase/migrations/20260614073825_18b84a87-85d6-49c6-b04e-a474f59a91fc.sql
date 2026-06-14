ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_motivation_style_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_motivation_style_check CHECK (motivation_style = ANY (ARRAY['faith'::text, 'winner'::text, 'mix'::text, 'general'::text]));
UPDATE public.profiles SET motivation_style = 'mix' WHERE motivation_style NOT IN ('faith','winner','mix','general');