import v4Logo from "@/assets/v4logo.png";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";

export function PendingApproval() {
  const { signOut, profile } = useAuth();

  const isPending = profile?.status === "pending";
  const isRejected = profile?.status === "rejected";

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0,0%,4%)] via-[hsl(0,40%,8%)] to-[hsl(0,0%,4%)]" />
      <div className="relative z-10 text-center max-w-md px-6">
        <img src={v4Logo} alt="V4 Company" className="h-12 mx-auto mb-6" />
        {isPending && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Aguardando Aprovação</h2>
            <p className="text-sm text-white/50 leading-relaxed mb-6">
              Seu cadastro foi recebido com sucesso. Um administrador irá revisar e aprovar seu acesso em breve.
            </p>
          </>
        )}
        {isRejected && (
          <>
            <h2 className="text-xl font-bold text-white mb-2">Acesso Negado</h2>
            <p className="text-sm text-white/50 leading-relaxed mb-6">
              Infelizmente, seu acesso foi recusado por um administrador. Entre em contato com a gestão para mais informações.
            </p>
          </>
        )}
        <Button variant="ghost" onClick={signOut} className="text-white/40 hover:text-white gap-2">
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}
