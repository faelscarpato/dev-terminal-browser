import { useRef } from "react";
import { Cloud, Download, FolderOpen, LogIn, Menu, Save, Settings, Upload, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

interface IDEHeaderProps {
  onToggleExplorer: () => void;
  onSettings: () => void;
  onCloudProjects: () => void;
  onSaveLocal: () => void;
  onSaveCloud: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  syncLabel: string;
}

export function IDEHeader({ onToggleExplorer, onSettings, onCloudProjects, onSaveLocal, onSaveCloud, onExport, onImport, syncLabel }: IDEHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated, user } = useAuth();
  return <header className="flex h-12 shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#111217] px-3"><div className="flex min-w-0 items-center gap-3"><Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-200" onClick={onToggleExplorer} title="Alternar Explorer"><Menu size={17} /></Button><div className="flex items-center gap-2"><div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-500/15 font-mono text-[10px] font-bold text-blue-300">&gt;_</div><div className="hidden sm:block"><p className="text-[12px] font-semibold tracking-tight text-zinc-200">DevTerminal</p><p className="text-[9px] uppercase tracking-[0.14em] text-zinc-600">browser IDE</p></div></div><div className="hidden h-5 w-px bg-white/[0.08] md:block" /><div className="hidden items-center gap-1.5 text-[10px] text-zinc-600 md:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{syncLabel}</div></div><div className="flex items-center gap-1"><Button variant="ghost" size="sm" className="hidden h-7 gap-1.5 px-2 text-[10px] text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-200 md:flex" onClick={onSaveLocal}><Save size={13} /> Salvar local</Button><Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-[10px] text-blue-300 hover:bg-blue-500/10 hover:text-blue-200" onClick={isAuthenticated ? onSaveCloud : startLogin}><Cloud size={13} /> <span className="hidden sm:inline">{isAuthenticated ? "Sincronizar" : "Entrar"}</span></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-200" onClick={onCloudProjects} title="Projetos na nuvem"><FolderOpen size={14} /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-200" onClick={onExport} title="Exportar ZIP"><Download size={14} /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-200" onClick={() => inputRef.current?.click()} title="Importar ZIP"><Upload size={14} /></Button><input ref={inputRef} className="hidden" type="file" accept=".zip,application/zip" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImport(file); event.target.value = ""; }} /><Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-200" onClick={onSettings} title="Configurações"><Settings size={14} /></Button><div className="ml-1 hidden items-center gap-1.5 border-l border-white/[0.08] pl-2 text-[10px] text-zinc-600 lg:flex">{isAuthenticated ? <><span className="max-w-24 truncate text-zinc-400">{user?.name ?? "Conta"}</span><Wifi size={12} className="text-emerald-400" /></> : <><span>offline</span><WifiOff size={12} /></>}</div></div></header>;
}
