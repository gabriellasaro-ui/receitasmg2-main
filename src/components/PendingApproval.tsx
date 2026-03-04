import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Clock, LogOut, X } from "lucide-react";

export function PendingApproval() {
  const { signOut, profile } = useAuth();

  const isPending = profile?.status === "pending";
  const isRejected = profile?.status === "rejected";

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#F8F9FA]">
      <div className="absolute inset-0 bg-white" />
      <div className="relative z-10 text-center max-w-md px-6 animate-fadeIn">
        <div className="w-20 h-20 bg-primary flex items-center justify-center rounded-3xl shadow-2xl shadow-primary/20 mx-auto mb-10 rotate-3 animate-fadeIn">
          <span className="text-white text-3xl font-black italic tracking-tighter">MG2</span>
        </div>

        {isPending && (
          <div className="space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full animate-ping bg-primary/20 opacity-20" />
              <Clock className="w-10 h-10 text-primary relative z-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Aguardando Aprovação</h2>
              <p className="text-slate-500 leading-relaxed max-w-sm mx-auto">
                Seu cadastro foi recebido com sucesso. Um administrador irá revisar e aprovar seu acesso em breve.
              </p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="space-y-6">
            <div className="w-20 h-20 rounded-full bg-destructive/5 border border-destructive/10 flex items-center justify-center mx-auto mb-6">
              <X className="w-10 h-10 text-destructive" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Acesso Negado</h2>
              <p className="text-slate-500 leading-relaxed max-w-sm mx-auto">
                Infelizmente, seu acesso foi recusado por um administrador. Entre em contato com a gestão para mais informações.
              </p>
            </div>
          </div>
        )}

        <div className="mt-12 pt-12 border-t border-slate-200">
          <Button variant="ghost" onClick={signOut} className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 gap-2 transition-all">
            <LogOut className="w-4 h-4" />
            Sair da conta
          </Button>
        </div>
      </div>
    </div>
  );
}
