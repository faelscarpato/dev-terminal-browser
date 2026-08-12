import { useEffect, useRef, useState } from "react";
import { FileExplorer } from "@/components/FileExplorer";
import { EditorPane } from "@/components/EditorPane";
import { TerminalPane } from "@/components/TerminalPane";
import { IDEHeader } from "@/components/IDEHeader";

interface IDELayoutProps {
  onSettings: () => void;
  onCloudProjects: () => void;
  onSaveLocal: () => void;
  onSaveCloud: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  syncLabel: string;
}

export function IDELayout(props: IDELayoutProps) {
  const [explorerVisible, setExplorerVisible] = useState(true);
  const [terminalPercent, setTerminalPercent] = useState(31);
  const [dragging, setDragging] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dragging) return;
    const move = (event: MouseEvent) => {
      const rect = mainRef.current?.getBoundingClientRect();
      if (!rect) return;
      const next = ((rect.bottom - event.clientY) / rect.height) * 100;
      setTerminalPercent(Math.max(18, Math.min(64, next)));
    };
    const up = () => setDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [dragging]);

  return <div className="ide-shell"><IDEHeader {...props} onToggleExplorer={() => setExplorerVisible((value) => !value)} /><main ref={mainRef} className="flex min-h-0 flex-1"><div className={`${explorerVisible ? "flex" : "hidden"} min-h-0`}><FileExplorer /></div><div className="flex min-w-0 flex-1 flex-col"><div className="min-h-0 flex-1" style={{ height: `${100 - terminalPercent}%` }}><EditorPane /></div><button aria-label="Redimensionar terminal" className={`h-1 shrink-0 cursor-row-resize border-y border-white/[0.05] bg-[#171921] transition-colors hover:bg-blue-400/50 ${dragging ? "bg-blue-400/70" : ""}`} onMouseDown={() => setDragging(true)} /><div className="min-h-0" style={{ height: `${terminalPercent}%` }}><TerminalPane /></div></div></main></div>;
}
