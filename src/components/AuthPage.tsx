import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import v4Logo from "@/assets/v4logo.png";
import { Eye, EyeOff, Upload, Image as ImageIcon } from "lucide-react";
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!unitId) return toast.error("Selecione uma unidade");
    if (!avatarFile) return toast.error("A foto de perfil é obrigatória");

    setLoading(true);
    try {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile);

      if (uploadError) throw new Error("Erro enviando foto: " + uploadError.message);

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error } = await signUp(email, password, fullName, role, unitId, publicUrl);
      if (error) {
        toast.error(error);
      } else {
        toast.success("Cadastro realizado! Aguarde aprovação.");
        setMode("login");
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro durante o cadastro');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarUrl(URL.createObjectURL(file));
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("E-mail enviado! Verifique a caixa de entrada.");
    setMode("login");
    setLoading(false);
  };

  const roleLabels: Record<AppRole, string> = {
    closer: "Closer",
    sdr: "SDR",
    gerente_unidade: "Gerente",
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans text-slate-900">

      {/* Lado Esquerdo - Área de Formulários (Branco Puro com destaques em Vermelho) */}
      <div className="w-full md:w-[45%] lg:w-[40%] flex flex-col justify-center px-8 sm:px-16 lg:px-24 bg-white relative shadow-2xl z-20">

        {/* Título Principal Fiel à Referência, mas em Tema Claro */}
        <div className="mb-10">
          <h2 className="text-[32px] lg:text-[40px] font-extrabold tracking-tight text-slate-900 leading-tight">
            Painel Receitas <span className="text-[#CC0000]">MG2</span>
          </h2>
          <p className="text-slate-600 mt-2 text-lg font-bold">
            {mode === "login" && "Faça seu Login."}
            {mode === "signup" && "Crie sua Conta."}
            {mode === "forgot" && "Recuperar Acesso."}
          </p>
        </div>

        {/* Formulários encapsulados com animação */}
        <div className="animate-in fade-in duration-500 w-full max-w-[420px]">

          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 ml-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 ml-1">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm text-slate-900 outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#CC0000] transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="flex justify-start mt-2">
                  <button type="button" onClick={() => setMode("forgot")} className="text-xs font-semibold text-slate-500 hover:text-[#CC0000] transition-colors ml-1 underline-offset-2 hover:underline">
                    Esqueci minha senha
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-sm font-bold text-white bg-[#CC0000] hover:bg-[#aa0000] transition-colors shadow-lg shadow-red-600/20">
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </div>

              <div className="pt-6 text-center">
                <button type="button" onClick={() => setMode("signup")} className="text-sm font-semibold text-slate-600 hover:text-[#CC0000] transition-colors">
                  Ainda não tenho uma conta
                </button>
              </div>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Uploader Muito Compacto */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-[#CC0000] cursor-pointer transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={20} className="text-slate-400 group-hover:text-[#CC0000]" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 group-hover:text-[#CC0000]">Foto de Perfil</p>
                  <p className="text-xs text-slate-500">Clique para enviar (Obrigatório)</p>
                </div>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleAvatarChange} />
              </div>

              {/* Grid 2 colunas para minimizar rolagem */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 ml-1">Nome Completo</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="João Silva" required className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 ml-1">E-mail Corporativo</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@v4company.com" required className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] transition-all" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 ml-1">Senha Segura (Mín 6)</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-3 pb-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 ml-1">Cargo</label>
                  <select value={role} onChange={e => setRole(e.target.value as AppRole)} className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] transition-all">
                    {Object.entries(roleLabels).map(([key, lbl]) => (
                      <option key={key} value={key}>{lbl}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 ml-1">Unidade</label>
                  <select value={unitId} onChange={e => setUnitId(e.target.value)} required className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] transition-all">
                    <option value="">Selecione...</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-sm font-bold text-white bg-[#CC0000] hover:bg-[#aa0000] transition-colors shadow-lg shadow-red-600/20">
                  {loading ? "Cadastrando..." : "Confirmar Cadastro"}
                </button>
              </div>

              <div className="pt-4 text-center">
                <button type="button" onClick={() => setMode("login")} className="text-xs font-semibold text-slate-500 hover:text-[#CC0000] transition-colors underline underline-offset-2">
                  Já tenho cadastro. Voltar ao Login.
                </button>
              </div>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 ml-1">E-mail Institucional</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 outline-none focus:border-[#CC0000] focus:ring-1 focus:ring-[#CC0000] transition-all"
                />
              </div>

              <div className="pt-4">
                <button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-sm font-bold text-white bg-[#CC0000] hover:bg-[#aa0000] transition-colors shadow-lg shadow-red-600/20">
                  {loading ? "Processando..." : "Enviar E-mail"}
                </button>
              </div>

              <div className="pt-6 text-center">
                <button type="button" onClick={() => setMode("login")} className="text-sm font-semibold text-slate-500 hover:text-[#CC0000] transition-colors underline-offset-2 hover:underline">
                  Voltar ao Login
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none text-slate-400 text-[10px] font-medium tracking-wide">
          © 2026 Desenvolvido para <span className="font-bold text-slate-900">V4 MG2 Regional</span>
        </div>
      </div>

      {/* Lado Direito - Identidade Visual Branca com Logo Vermelha */}
      <div className="flex-1 hidden md:flex flex-col items-center justify-center relative w-full h-screen overflow-hidden bg-slate-50 border-l border-slate-200">

        <img
          src={v4Logo}
          alt="V4 Company"
          className="w-full max-w-[450px] max-h-[450px] object-contain drop-shadow-[0_10px_30px_rgba(204,0,0,0.15)] mix-blend-multiply"
          style={{
            // Converte a logo branca/preta para o tom exato vermelho V4 (#CC0000)
            filter: 'brightness(0) saturate(100%) invert(13%) sepia(93%) saturate(6144%) hue-rotate(356deg) brightness(89%) contrast(117%)'
          }}
        />

      </div>
    </div>
  );
}
