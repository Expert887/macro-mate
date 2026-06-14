import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Flame } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Acceder · MacroFit AI" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard",
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Cuenta creada. Inicia sesión.");
        setMode("in");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function googleSignIn() {
    setLoading(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/dashboard",
      });
      if (res.error) throw res.error;
      if (!res.redirected) navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error con Google");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">MacroFit AI</h1>
            <p className="mt-1 text-sm text-muted-foreground">Tu coach inteligente de macros y progreso.</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="mb-5 flex rounded-lg bg-muted/40 p-1">
              <button
                type="button"
                onClick={() => setMode("in")}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${mode === "in" ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}
              >Iniciar sesión</button>
              <button
                type="button"
                onClick={() => setMode("up")}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${mode === "up" ? "bg-card text-foreground shadow" : "text-muted-foreground"}`}
              >Crear cuenta</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "up" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "..." : mode === "in" ? "Entrar" : "Crear cuenta"}
              </Button>
            </form>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> o <div className="h-px flex-1 bg-border" />
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={googleSignIn} disabled={loading}>
              Continuar con Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
