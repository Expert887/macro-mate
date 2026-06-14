import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Flame, Camera, LineChart, HeartHandshake } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MacroFit AI — Coach inteligente de macros 2026" },
      { name: "description", content: "Analiza tu comida con IA, controla macros, progreso físico y mantén la motivación con fe y mentalidad ganadora." },
      { property: "og:title", content: "MacroFit AI — Coach inteligente de macros 2026" },
      { property: "og:description", content: "Analiza tu comida con IA, controla macros y progreso físico." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Flame className="h-5 w-5" />
          </div>
          <span className="font-semibold tracking-tight">MacroFit AI</span>
        </div>
        <Button asChild size="sm"><Link to="/auth">Entrar</Link></Button>
      </header>
      <section className="mx-auto max-w-3xl px-5 pb-16 pt-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Élite Performance · 2026
        </div>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          Tu coach inteligente de <span className="text-primary">macros</span> y progreso.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
          Sube una foto de tu comida y la IA te dice cuánta proteína, carbs y grasa tiene.
          Lleva tu peso, tu progreso y mantén la fe con motivación diaria.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg"><Link to="/auth">Empezar gratis</Link></Button>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: Camera, t: "Analiza con la cámara", d: "Foto → macros estimados al instante." },
            { icon: LineChart, t: "Progreso físico", d: "Peso, medidas y comparaciones." },
            { icon: HeartHandshake, t: "Motivación de fe", d: "Frases diarias que te impulsan." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-border bg-card/60 p-5 text-left">
              <Icon className="mb-3 h-5 w-5 text-primary" />
              <div className="font-semibold">{t}</div>
              <div className="mt-1 text-sm text-muted-foreground">{d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
