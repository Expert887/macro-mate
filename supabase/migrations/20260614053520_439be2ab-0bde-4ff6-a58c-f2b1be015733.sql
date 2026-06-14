
-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  sex TEXT CHECK (sex IN ('male','female','other')),
  birth_date DATE,
  height_cm NUMERIC(5,1),
  current_weight_kg NUMERIC(5,1),
  goal_weight_kg NUMERIC(5,1),
  activity_level TEXT CHECK (activity_level IN ('sedentary','light','moderate','active','very_active')) DEFAULT 'moderate',
  goal TEXT CHECK (goal IN ('lose','maintain','gain')) DEFAULT 'maintain',
  target_kcal INT DEFAULT 2200,
  target_protein_g INT DEFAULT 150,
  target_carbs_g INT DEFAULT 250,
  target_fat_g INT DEFAULT 70,
  motivation_style TEXT CHECK (motivation_style IN ('faith','general')) DEFAULT 'faith',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self" ON public.profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- meals
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  eaten_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  slot TEXT CHECK (slot IN ('desayuno','media_manana','almuerzo','snack','cena','otro')) DEFAULT 'otro',
  name TEXT NOT NULL,
  photo_url TEXT,
  kcal NUMERIC(7,1) NOT NULL DEFAULT 0,
  protein_g NUMERIC(6,1) NOT NULL DEFAULT 0,
  carbs_g NUMERIC(6,1) NOT NULL DEFAULT 0,
  fat_g NUMERIC(6,1) NOT NULL DEFAULT 0,
  items JSONB,
  notes TEXT,
  source TEXT CHECK (source IN ('ai_photo','manual')) DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meals TO authenticated;
GRANT ALL ON public.meals TO service_role;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meals_self" ON public.meals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX meals_user_eaten_idx ON public.meals(user_id, eaten_at DESC);

-- weight_logs
CREATE TABLE public.weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_on DATE NOT NULL DEFAULT current_date,
  weight_kg NUMERIC(5,1) NOT NULL,
  body_fat_pct NUMERIC(4,1),
  waist_cm NUMERIC(5,1),
  chest_cm NUMERIC(5,1),
  arm_cm NUMERIC(5,1),
  hip_cm NUMERIC(5,1),
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, logged_on)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_logs TO authenticated;
GRANT ALL ON public.weight_logs TO service_role;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "weight_logs_self" ON public.weight_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX weight_logs_user_date_idx ON public.weight_logs(user_id, logged_on DESC);

-- meal_schedule
CREATE TABLE public.meal_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slot TEXT NOT NULL CHECK (slot IN ('desayuno','media_manana','almuerzo','snack','cena')),
  time_of_day TIME NOT NULL,
  target_kcal INT,
  enabled BOOLEAN DEFAULT true,
  UNIQUE (user_id, slot)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_schedule TO authenticated;
GRANT ALL ON public.meal_schedule TO service_role;
ALTER TABLE public.meal_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meal_schedule_self" ON public.meal_schedule FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- auto-create profile + default meal schedule on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.meal_schedule (user_id, slot, time_of_day, target_kcal) VALUES
    (NEW.id, 'desayuno', '08:00', 500),
    (NEW.id, 'media_manana', '11:00', 250),
    (NEW.id, 'almuerzo', '13:30', 700),
    (NEW.id, 'snack', '17:00', 250),
    (NEW.id, 'cena', '20:30', 500);
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
