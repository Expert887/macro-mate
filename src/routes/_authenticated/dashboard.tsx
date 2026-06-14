import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { AppShell, MacroRing } from "@/components/app-shell";
import { getTodayMeals, deleteMeal } from "@/lib/meals.functions";
import { getMyProfile } from "@/lib/profile.functions";
import { pickQuote, type MotivationStyle } from "@/lib/motivation-quotes";
import { SLOT_LABELS } from "@/lib/macros";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Trash2, Quote, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Hoy · MacroFit AI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const router = useRouter();
  const fetchMeals = useServerFn(getTodayMeals);
  const fetchProfile = useServerFn(getMyProfile);
  const removeMeal = useServerFn(deleteMeal);

  const meals = useQuery({ queryKey: ["meals", "today"], queryFn: () => fetchMeals() });
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });

  const totals = (meals.data ?? []).reduce(
    (acc, m) => ({
      kcal: acc.kcal + Number(m.kcal || 0),
      protein: acc.protein + Number(m.protein_g || 0),
      carbs: acc.carbs + Number(m.carbs_g || 0),
      fat: acc.fat + Number(m.fat_g || 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const p = profile.data;
  const quote = pickQuote((p?.motivation_style as MotivationStyle) ?? "mix");

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  async function handleDelete(id: string) {
    await removeMeal({ data: { id } });
    toast.success("Comida eliminada");
    meals.refetch();
  }

  return (
    <AppShell>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Hoy</div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hola{p?.display_name ? `, ${p.display_name}` : ""} 👋
          </h1>
        </div>
        <Button variant="ghost" size="icon" onClick={handleSignOut} title="Salir">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      <Card className="mb-5 overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="flex items-start gap-3 p-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Quote className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm leading-relaxed">{quote.text}</p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">— {quote.source}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-5">
        <CardContent className="p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Macros de hoy</h2>
            <div className="text-xs text-muted-foreground">
              {Math.round(totals.kcal)} / {p?.target_kcal ?? 2200} kcal
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <MacroRing label="Kcal" value={totals.kcal} target={p?.target_kcal ?? 2200} color="var(--kcal)" unit="" />
            <MacroRing label="Proteína" value={totals.protein} target={p?.target_protein_g ?? 150} color="var(--protein)" />
            <MacroRing label="Carbs" value={totals.carbs} target={p?.target_carbs_g ?? 250} color="var(--carbs)" />
            <MacroRing label="Grasa" value={totals.fat} target={p?.target_fat_g ?? 70} color="var(--fat)" />
          </div>
        </CardContent>
      </Card>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Comidas</h2>
        <Button asChild size="sm"><Link to="/analizar"><Camera className="h-4 w-4" /> Analizar</Link></Button>
      </div>

      <div className="space-y-2">
        {meals.isLoading && <div className="text-sm text-muted-foreground">Cargando…</div>}
        {meals.data?.length === 0 && (
          <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">
            Aún no has registrado comidas hoy. Toca <strong>Analizar</strong> para empezar.
          </CardContent></Card>
        )}
        {meals.data?.map((m) => (
          <Card key={m.id}>
            <CardContent className="flex items-center gap-3 p-4">
              {m.photo_url ? (
                <img src={m.photo_url} alt="" className="h-14 w-14 rounded-lg object-cover" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                  {SLOT_LABELS[m.slot ?? "otro"]?.[0] ?? "·"}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate font-medium">{m.name}</div>
                  <div className="tabular-nums text-sm text-muted-foreground">{Math.round(Number(m.kcal))} kcal</div>
                </div>
                <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                  <span><span className="text-[color:var(--protein)]">P</span> {Math.round(Number(m.protein_g))}g</span>
                  <span><span className="text-[color:var(--carbs)]">C</span> {Math.round(Number(m.carbs_g))}g</span>
                  <span><span className="text-[color:var(--fat)]">G</span> {Math.round(Number(m.fat_g))}g</span>
                  <span className="ml-auto">{SLOT_LABELS[m.slot ?? "otro"]}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
