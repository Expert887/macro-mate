import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { calcAge, macroTargets, type Activity, type Goal, type Sex } from "./macros";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

const ProfileInput = z.object({
  display_name: z.string().optional(),
  sex: z.enum(["male", "female"]).optional(),
  birth_date: z.string().optional(),
  height_cm: z.number().optional(),
  current_weight_kg: z.number().optional(),
  goal_weight_kg: z.number().optional(),
  activity_level: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).optional(),
  goal: z.enum(["lose", "maintain", "gain"]).optional(),
  motivation_style: z.enum(["faith", "winner", "mix"]).optional(),
  recalc: z.boolean().optional(),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProfileInput.parse(d))
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = { ...data };
    delete patch.recalc;

    if (data.recalc && data.sex && data.birth_date && data.height_cm && data.current_weight_kg && data.activity_level && data.goal) {
      const t = macroTargets({
        sex: data.sex as Sex,
        weightKg: data.current_weight_kg,
        heightCm: data.height_cm,
        age: calcAge(data.birth_date),
        activity: data.activity_level as Activity,
        goal: data.goal as Goal,
      });
      patch.target_kcal = t.kcal;
      patch.target_protein_g = t.protein;
      patch.target_carbs_g = t.carbs;
      patch.target_fat_g = t.fat;
    }

    const { data: row, error } = await context.supabase
      .from("profiles")
      .update(patch)
      .eq("id", context.userId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
