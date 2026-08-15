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
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!dragging) return;

    const move = (event: MouseEvent) => {
      const rect = mainRef.current?.getBoundingClientRect();
      if (!rect || rect.height <= 0) return;

      const next = ((rect.bottom - event.clientY) / rect.height) * 100;
      setTerminalPercent(Math.max(18, Math.min(64, next)));
    };

    const up = () => setDragging(false);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [dragging]);

  const editorPercent = 100 - terminalPercent;

  return (
    <div className="ide-shell">
      <IDEHeader {...props} onToggleExplorer={() => setExplorerVisible((value) => !value)} />
      <main ref={mainRef} className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className={`${explorerVisible ? "flex" : "hidden"} min-h-0 h-full shrink-0 overflow-hidden`}>
          <FileExplorer />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div
            className="min-h-0 min-w-0 shrink-0 overflow-hidden"
            style={{ height: `${editorPercent}%`, flex: `0 0 ${editorPercent}%` }}
          >
            <EditorPane />
          </div>

          <button
            type="button"
            aria-label="Redimensionar terminal"
            className={`h-1 min-h-1 shrink-0 cursor-row-resize border-y border-white/[0.05] bg-[#171921] transition-colors hover:bg-blue-400/50 ${
              dragging ? "bg-blue-400/70" : ""
            }`}
            onMouseDown={() => setDragging(true)}
          />

          <div
            className="min-h-0 min-w-0 shrink-0 overflow-hidden"
            style={{ height: `${terminalPercent}%`, flex: `0 0 ${terminalPercent}%` }}
          >
            <TerminalPane />
          </div>
        </div>
      </main>
    </div>
  );
}
