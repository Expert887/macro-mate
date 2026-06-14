import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const TodayMealsInput = z.object({}).optional();

export const getTodayMeals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { data, error } = await context.supabase
      .from("meals")
      .select("*")
      .gte("eaten_at", start.toISOString())
      .order("eaten_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const AnalyzeInput = z.object({
  imageDataUrl: z.string().min(20),
  hint: z.string().optional(),
});

type Analysis = {
  name: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  items: { name: string; grams?: number; kcal?: number }[];
  notes?: string;
};

export const analyzeFoodImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AnalyzeInput.parse(d))
  .handler(async ({ data }): Promise<Analysis> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Falta LOVABLE_API_KEY");

    const body = {
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content:
            "Eres un nutricionista experto. Analiza la foto de comida y estima macros realistas. Responde SOLO con JSON válido en español, sin texto adicional, con la forma: {\"name\":string,\"kcal\":number,\"protein_g\":number,\"carbs_g\":number,\"fat_g\":number,\"items\":[{\"name\":string,\"grams\":number,\"kcal\":number}],\"notes\":string}. Si no puedes identificar comida, devuelve kcal 0 y notes explicando.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analiza esta comida y estima los macros totales. ${data.hint ? "Pista del usuario: " + data.hint : ""}`,
            },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify(body),
    });

    if (res.status === 429) throw new Error("Límite de IA alcanzado. Intenta más tarde.");
    if (res.status === 402) throw new Error("Sin créditos de IA. Agrega créditos al workspace.");
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
    }

    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: Analysis;
    try {
      parsed = typeof content === "string" ? JSON.parse(content) : content;
    } catch {
      throw new Error("La IA devolvió una respuesta inválida.");
    }
    return {
      name: parsed.name ?? "Comida",
      kcal: Number(parsed.kcal) || 0,
      protein_g: Number(parsed.protein_g) || 0,
      carbs_g: Number(parsed.carbs_g) || 0,
      fat_g: Number(parsed.fat_g) || 0,
      items: Array.isArray(parsed.items) ? parsed.items : [],
      notes: parsed.notes,
    };
  });

const SaveInput = z.object({
  name: z.string().min(1),
  kcal: z.number().min(0),
  protein_g: z.number().min(0),
  carbs_g: z.number().min(0),
  fat_g: z.number().min(0),
  slot: z.string().default("otro"),
  source: z.string().default("ai"),
  items: z.any().optional(),
  notes: z.string().optional(),
  photo_url: z.string().optional(),
});

export const saveMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaveInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase
      .from("meals")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("meals").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
