import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Sparkles, Upload, Loader2 } from "lucide-react";
import { analyzeFoodImage, saveMeal } from "@/lib/meals.functions";
import { SLOT_LABELS, SLOT_ORDER } from "@/lib/macros";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/analizar")({
  head: () => ({ meta: [{ title: "Analizar comida · MacroFit AI" }] }),
  component: Analizar,
});

type Analysis = {
  name: string; kcal: number; protein_g: number; carbs_g: number; fat_g: number;
  items: { name: string; grams?: number; kcal?: number }[]; notes?: string;
};

function defaultSlot(): string {
  const h = new Date().getHours();
  if (h < 10) return "desayuno";
  if (h < 12) return "media_manana";
  if (h < 15) return "almuerzo";
  if (h < 19) return "snack";
  return "cena";
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function Analizar() {
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeFoodImage);
  const save = useServerFn(saveMeal);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [slot, setSlot] = useState<string>(defaultSlot());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<Analysis | null>(null);

  async function handleFile(file?: File) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Imagen demasiado grande (máx 8MB)");
      return;
    }
    const url = await fileToDataUrl(file);
    setImageDataUrl(url);
    setResult(null);
  }

  async function runAnalysis() {
    if (!imageDataUrl) return;
    setLoading(true);
    try {
      const res = await analyze({ data: { imageDataUrl, hint: hint || undefined } });
      setResult(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al analizar");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      await save({
        data: {
          name: result.name,
          kcal: result.kcal,
          protein_g: result.protein_g,
          carbs_g: result.carbs_g,
          fat_g: result.fat_g,
          slot,
          source: "ai",
          items: result.items,
          notes: result.notes,
        },
      });
      toast.success("Comida guardada");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  function updateField(k: keyof Analysis, v: number) {
    if (!result) return;
    setResult({ ...result, [k]: v });
  }

  return (
    <AppShell>
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cámara IA</div>
        <h1 className="text-2xl font-bold tracking-tight">Analizar comida</h1>
        <p className="mt-1 text-sm text-muted-foreground">Toma una foto y la IA estimará los macros.</p>
      </div>

      <Card className="mb-4">
        <CardContent className="p-5">
          {imageDataUrl ? (
            <div className="relative">
              <img src={imageDataUrl} alt="comida" className="aspect-square w-full rounded-xl object-cover" />
              <Button variant="secondary" size="sm" className="absolute right-2 top-2" onClick={() => { setImageDataUrl(null); setResult(null); }}>
                Cambiar
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => camRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                <Camera className="h-6 w-6" /> Cámara
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/20 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                <Upload className="h-6 w-6" /> Subir
              </button>
            </div>
          )}
          <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files?.[0])} />

          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="hint">Pista (opcional)</Label>
              <Input id="hint" placeholder="Ej: pollo a la plancha, ~200g" value={hint} onChange={(e) => setHint(e.target.value)} />
            </div>
            <Button onClick={runAnalysis} disabled={!imageDataUrl || loading} className="w-full">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analizando…</> : <><Sparkles className="h-4 w-4" /> Analizar con IA</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={result.name} onChange={(e) => setResult({ ...result, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Calorías</Label>
                <Input type="number" value={result.kcal} onChange={(e) => updateField("kcal", Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Momento</Label>
                <Select value={slot} onValueChange={setSlot}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SLOT_ORDER.map((s) => <SelectItem key={s} value={s}>{SLOT_LABELS[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Proteína (g)</Label>
                <Input type="number" value={result.protein_g} onChange={(e) => updateField("protein_g", Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>Carbs (g)</Label>
                <Input type="number" value={result.carbs_g} onChange={(e) => updateField("carbs_g", Number(e.target.value))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Grasa (g)</Label>
                <Input type="number" value={result.fat_g} onChange={(e) => updateField("fat_g", Number(e.target.value))} />
              </div>
            </div>
            {result.items?.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/20 p-3 text-xs">
                <div className="mb-1.5 font-semibold uppercase tracking-wider text-muted-foreground">Detectado</div>
                <ul className="space-y-1">
                  {result.items.map((it, i) => (
                    <li key={i} className="flex justify-between gap-2">
                      <span>{it.name}{it.grams ? ` · ${it.grams}g` : ""}</span>
                      {it.kcal != null && <span className="tabular-nums text-muted-foreground">{Math.round(it.kcal)} kcal</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.notes && <p className="text-xs text-muted-foreground">{result.notes}</p>}
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Guardando…" : "Guardar en mi diario"}
            </Button>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
