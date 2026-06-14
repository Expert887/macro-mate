import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Perfil · MacroFit AI" }] }),
  component: Perfil,
});

function Perfil() {
  const fetchProfile = useServerFn(getMyProfile);
  const save = useServerFn(updateMyProfile);
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile() });
  const [form, setForm] = useState({
    display_name: "",
    sex: "male",
    birth_date: "",
    height_cm: "",
    current_weight_kg: "",
    goal_weight_kg: "",
    activity_level: "moderate",
    goal: "maintain",
    motivation_style: "mix",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const p = profile.data;
    if (!p) return;
    setForm({
      display_name: p.display_name ?? "",
      sex: p.sex ?? "male",
      birth_date: p.birth_date ?? "",
      height_cm: p.height_cm?.toString() ?? "",
      current_weight_kg: p.current_weight_kg?.toString() ?? "",
      goal_weight_kg: p.goal_weight_kg?.toString() ?? "",
      activity_level: p.activity_level ?? "moderate",
      goal: p.goal ?? "maintain",
      motivation_style: p.motivation_style ?? "mix",
    });
  }, [profile.data]);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(recalc: boolean) {
    setSaving(true);
    try {
      await save({
        data: {
          display_name: form.display_name || undefined,
          sex: form.sex as "male" | "female",
          birth_date: form.birth_date || undefined,
          height_cm: form.height_cm ? Number(form.height_cm) : undefined,
          current_weight_kg: form.current_weight_kg ? Number(form.current_weight_kg) : undefined,
          goal_weight_kg: form.goal_weight_kg ? Number(form.goal_weight_kg) : undefined,
          activity_level: form.activity_level as "sedentary" | "light" | "moderate" | "active" | "very_active",
          goal: form.goal as "lose" | "maintain" | "gain",
          motivation_style: form.motivation_style as "faith" | "winner" | "mix",
          recalc,
        },
      });
      toast.success(recalc ? "Macros recalculados" : "Perfil guardado");
      profile.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cuenta</div>
        <h1 className="text-2xl font-bold tracking-tight">Tu perfil</h1>
      </div>

      <Card className="mb-4">
        <CardContent className="space-y-4 p-5">
          <Field label="Nombre"><Input value={form.display_name} onChange={(e) => set("display_name", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sexo">
              <Select value={form.sex} onValueChange={(v) => set("sex", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Hombre</SelectItem>
                  <SelectItem value="female">Mujer</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Fecha de nacimiento"><Input type="date" value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} /></Field>
            <Field label="Altura (cm)"><Input type="number" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} /></Field>
            <Field label="Peso actual (kg)"><Input type="number" step="0.1" value={form.current_weight_kg} onChange={(e) => set("current_weight_kg", e.target.value)} /></Field>
            <Field label="Peso meta (kg)"><Input type="number" step="0.1" value={form.goal_weight_kg} onChange={(e) => set("goal_weight_kg", e.target.value)} /></Field>
            <Field label="Actividad">
              <Select value={form.activity_level} onValueChange={(v) => set("activity_level", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentario</SelectItem>
                  <SelectItem value="light">Ligero</SelectItem>
                  <SelectItem value="moderate">Moderado</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="very_active">Muy activo</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Objetivo">
              <Select value={form.goal} onValueChange={(v) => set("goal", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lose">Perder grasa</SelectItem>
                  <SelectItem value="maintain">Mantener</SelectItem>
                  <SelectItem value="gain">Ganar músculo</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Motivación">
              <Select value={form.motivation_style} onValueChange={(v) => set("motivation_style", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="faith">Fe</SelectItem>
                  <SelectItem value="winner">Ganadora</SelectItem>
                  <SelectItem value="mix">Mezcla</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => submit(false)} disabled={saving} className="flex-1">Guardar</Button>
            <Button onClick={() => submit(true)} disabled={saving} className="flex-1">Recalcular macros</Button>
          </div>
        </CardContent>
      </Card>

      {profile.data && (
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Metas actuales</div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              {[
                { l: "Kcal", v: profile.data.target_kcal, c: "var(--kcal)" },
                { l: "Proteína", v: profile.data.target_protein_g, c: "var(--protein)" },
                { l: "Carbs", v: profile.data.target_carbs_g, c: "var(--carbs)" },
                { l: "Grasa", v: profile.data.target_fat_g, c: "var(--fat)" },
              ].map((x) => (
                <div key={x.l} className="rounded-lg border border-border bg-muted/20 p-3">
                  <div className="text-lg font-bold tabular-nums" style={{ color: x.c }}>{x.v ?? "—"}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{x.l}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}
