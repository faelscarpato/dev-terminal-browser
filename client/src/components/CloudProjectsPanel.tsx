import { useEffect, useState } from "react";
import { Cloud, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import type { FileNode, IDEPreferences } from "@/contexts/IDEContext";

export function CloudProjectsPanel({ onClose, onLoad }: { onClose: () => void; onLoad: (files: FileNode[], preferences: IDEPreferences) => void }) {
  const { isAuthenticated } = useAuth();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const projects = trpc.projects.list.useQuery(undefined, { enabled: isAuthenticated });
  const selected = trpc.projects.get.useQuery({ id: selectedId ?? 0 }, { enabled: isAuthenticated && selectedId !== null });
  const remove = trpc.projects.delete.useMutation({ onSuccess: () => projects.refetch() });

  useEffect(() => {
    if (!selected.data) return;
    try {
      onLoad(JSON.parse(selected.data.filesJson) as FileNode[], JSON.parse(selected.data.preferencesJson) as IDEPreferences);
      onClose();
    } catch {
      alert("Não foi possível interpretar o projeto salvo.");
    }
  }, [selected.data, onClose, onLoad]);

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}><div className="w-full max-w-lg overflow-hidden rounded-xl border border-white/[0.1] bg-[#15161c] shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/15 text-blue-300"><Cloud size={16} /></span><div><p className="text-sm font-semibold text-zinc-100">Projetos na nuvem</p><p className="text-[11px] text-zinc-600">Sincronizados com a sua conta</p></div></div><Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500" onClick={onClose}><X size={16} /></Button></div>{!isAuthenticated ? <div className="p-8 text-center"><p className="text-sm text-zinc-300">Entre para sincronizar projetos</p><p className="mt-2 text-xs leading-5 text-zinc-600">A sessão local continua disponível sem autenticação. O login é necessário apenas para salvar na nuvem.</p></div> : projects.isLoading ? <div className="flex items-center justify-center gap-2 p-10 text-xs text-zinc-500"><Loader2 size={14} className="animate-spin" /> Carregando projetos</div> : projects.data?.length ? <div className="max-h-80 overflow-auto p-3">{projects.data.map((project) => <div key={project.id} className="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-white/[0.04]"><button className="min-w-0 flex-1 text-left" onClick={() => setSelectedId(project.id)}><p className="truncate text-sm text-zinc-300">{project.name}</p><p className="mt-1 text-[10px] text-zinc-600">Atualizado em {new Date(project.updatedAt).toLocaleString("pt-BR")}</p></button><button className="rounded p-2 text-zinc-600 hover:bg-red-500/10 hover:text-red-300" onClick={() => remove.mutate({ id: project.id })} title="Excluir"><Trash2 size={14} /></button></div>)}</div> : <div className="p-10 text-center text-xs text-zinc-600">Nenhum projeto sincronizado ainda.</div>}<div className="flex justify-end border-t border-white/[0.07] px-5 py-3"><Button variant="outline" className="h-8 text-xs" onClick={onClose}>Fechar</Button></div></div></div>;
}
