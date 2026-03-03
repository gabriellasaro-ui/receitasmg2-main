import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Camera, User, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function ProfileView() {
    const { profile, user, refreshProfile } = useAuth();
    const [fullName, setFullName] = useState(profile?.full_name || "");
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error("A imagem deve ter no máximo 2MB");
            return;
        }

        try {
            setUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);
            toast.success("Foto carregada com sucesso!");
        } catch (error: any) {
            toast.error("Erro no upload: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!fullName.trim()) {
            toast.error("O nome não pode estar vazio");
            return;
        }

        try {
            setSaving(true);

            // Update profile in database
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    avatar_url: avatarUrl
                })
                .eq('user_id', user?.id);

            if (profileError) throw profileError;

            // Update auth metadata
            const { error: authError } = await supabase.auth.updateUser({
                data: { full_name: fullName, avatar_url: avatarUrl }
            });

            if (authError) throw authError;

            if (refreshProfile) await refreshProfile();

            toast.success("Perfil atualizado com sucesso!");
        } catch (error: any) {
            toast.error("Erro ao salvar: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <User className="w-6 h-6 text-primary" />
                    Configurações de Perfil
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Gerencie suas informações pessoais na plataforma</p>
            </div>

            <Card className="border-border/40 shadow-xl shadow-black/5 overflow-hidden">
                <CardHeader className="bg-secondary/20 border-b border-border/40 pb-8 pt-10 px-8 flex flex-col items-center">
                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-lg bg-secondary flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-12 h-12 text-muted-foreground" />
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 p-2 bg-primary text-primary-foreground rounded-full shadow-md border-2 border-background transform transition-all duration-300 group-hover:scale-110 z-10">
                            <Camera className="w-4 h-4" />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={uploading}
                        />
                    </div>
                    <CardTitle className="mt-4 text-xl">{fullName || "Seu Nome"}</CardTitle>
                    <CardDescription>{user?.email}</CardDescription>
                </CardHeader>

                <CardContent className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground ml-1">Nome Completo</label>
                        <Input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Digite seu nome completo"
                            className="h-11 rounded-xl bg-secondary/30 border-border/40 focus:ring-primary/20"
                        />
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={saving || uploading}
                            className="w-full h-11 rounded-xl gap-2 font-semibold shadow-lg shadow-primary/20"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Salvar Alterações
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                    <Camera className="w-4 h-4 text-primary" />
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-primary">Dica de Perfil</h4>
                    <p className="text-[12px] text-muted-foreground mt-1">
                        Recomendamos o uso de uma foto de rosto com fundo neutro para melhor visibilidade nos rankings e dashboard.
                    </p>
                </div>
            </div>
        </div>
    );
}
