import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import v4Logo from "@/assets/v4logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, EyeOff, LogIn, UserPlus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type AppRole = "closer" | "sdr" | "gerente_unidade";

interface Unit {
  id: string;
  name: string;
}

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AppRole>("closer");
  const [unitId, setUnitId] = useState("");
  const [units, setUnits] = useState<Unit[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("units").select("*").order("name").then(({ data }) => {
      if (data) setUnits(data);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) toast.error(error);
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitId) {
      toast.error("Selecione uma unidade");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName, role, unitId);
    if (error) {
      toast.error(error);
    } else {
      toast.success("Cadastro realizado! Verifique seu e-mail e aguarde aprovação de um administrador.");
      setMode("login");
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("E-mail de recuperação enviado!");
      setMode("login");
    }
    setLoading(false);
  };

  const roleLabels: Record<AppRole, string> = {
    closer: "Closer",
    sdr: "SDR",
    gerente_unidade: "Gerente de Unidade",
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0,0%,4%)] via-[hsl(0,40%,8%)] to-[hsl(0,0%,4%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(0,80%,48%,0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(0,80%,48%,0.05),transparent_50%)]" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src={v4Logo} alt="V4 Company" className="h-14 mb-4" />
          <h1 className="text-2xl font-bold text-white tracking-tight">MG2 — Meta Comercial</h1>
          <p className="text-sm text-white/50 mt-1">Sistema de Gestão Regional</p>
        </div>

        <Card className="border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-2xl shadow-black/40">
          <CardContent className="pt-6 pb-8 px-6">
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-white/70 text-xs uppercase tracking-wider">E-mail</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70 text-xs uppercase tracking-wider">Senha</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      required
                      className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/30 pr-10 focus-visible:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-11 font-semibold text-sm gap-2">
                  <LogIn className="w-4 h-4" />
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
                <div className="flex items-center justify-between text-xs">
                  <button type="button" onClick={() => setMode("forgot")} className="text-white/40 hover:text-primary transition-colors">
                    Esqueci minha senha
                  </button>
                  <button type="button" onClick={() => setMode("signup")} className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Criar conta
                  </button>
                </div>
              </form>
            )}

            {mode === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <button type="button" onClick={() => setMode("login")} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mb-2">
                  <ArrowLeft className="w-3 h-3" /> Voltar ao login
                </button>
                <div className="space-y-2">
                  <Label className="text-white/70 text-xs uppercase tracking-wider">Nome completo</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome"
                    required
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70 text-xs uppercase tracking-wider">E-mail</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70 text-xs uppercase tracking-wider">Senha</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70 text-xs uppercase tracking-wider">Cargo</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(roleLabels) as [AppRole, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setRole(key)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                          role === key
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                            : "bg-white/[0.04] text-white/60 border-white/10 hover:border-white/20"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70 text-xs uppercase tracking-wider">Unidade</Label>
                  <select
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-md border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <option value="" className="bg-[hsl(0,0%,8%)]">Selecione...</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id} className="bg-[hsl(0,0%,8%)]">{u.name}</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" disabled={loading} className="w-full h-11 font-semibold text-sm gap-2">
                  <UserPlus className="w-4 h-4" />
                  {loading ? "Cadastrando..." : "Criar conta"}
                </Button>
                <p className="text-[11px] text-white/30 text-center leading-relaxed">
                  Após o cadastro, um administrador precisará aprovar seu acesso.
                </p>
              </form>
            )}

            {mode === "forgot" && (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <button type="button" onClick={() => setMode("login")} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors mb-2">
                  <ArrowLeft className="w-3 h-3" /> Voltar ao login
                </button>
                <div className="space-y-2">
                  <Label className="text-white/70 text-xs uppercase tracking-wider">E-mail</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary"
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full h-11 font-semibold text-sm">
                  {loading ? "Enviando..." : "Enviar e-mail de recuperação"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-white/20 mt-6">V4 Company © 2026 — MG2 Regional</p>
      </div>
    </div>
  );
}
