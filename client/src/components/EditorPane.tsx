import { X, FileCode2 } from "lucide-react";
import Editor from "@monaco-editor/react";
import { useIDE, getNodeById } from "@/contexts/IDEContext";

export function EditorPane() {
  const { files, openTabs, activeTabId, setActiveTab, closeTab, updateFile, preferences } = useIDE();
  const activeTab = openTabs.find((tab) => tab.id === activeTabId);
  const activeFile = activeTab ? getNodeById(files, activeTab.fileId) : null;

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-[#0d0e12]">
      <div className="flex h-10 shrink-0 items-stretch overflow-x-auto border-b border-white/[0.06] bg-[#101116]">
        {openTabs.length === 0 ? (
          <div className="flex items-center gap-2 px-4 text-[11px] text-zinc-600"><FileCode2 size={14} />Nenhum arquivo aberto</div>
        ) : openTabs.map((tab) => {
          const file = getNodeById(files, tab.fileId);
          if (!file) return null;
          return (
            <button key={tab.id} className={`group flex min-w-[130px] items-center gap-2 border-r border-white/[0.06] px-3 text-left text-[12px] ${tab.id === activeTabId ? "border-t-2 border-t-blue-400 bg-[#0d0e12] text-zinc-200" : "text-zinc-500 hover:bg-white/[0.03]"}`} onClick={() => setActiveTab(tab.id)}>
              <FileCode2 size={13} className={tab.id === activeTabId ? "text-blue-300" : "text-zinc-600"} />
              <span className="min-w-0 flex-1 truncate">{file.name}</span>
              {tab.dirty && <span className="text-blue-300">•</span>}
              <span className="rounded p-0.5 opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100" onClick={(event) => { event.stopPropagation(); closeTab(tab.id); }}><X size={13} /></span>
            </button>
          );
        })}
      </div>
      {activeFile && activeFile.kind === "file" ? (
        <div className="min-h-0 flex-1">
          <Editor
            height="100%"
            language={activeFile.language ?? "plaintext"}
            value={activeFile.content ?? ""}
            theme="vs-dark"
            onChange={(value) => updateFile(activeFile.id, value ?? "")}
            options={{
              automaticLayout: true,
              fontSize: preferences.editorFontSize,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              minimap: { enabled: preferences.minimap },
              wordWrap: preferences.wordWrap,
              tabSize: preferences.tabSize,
              insertSpaces: true,
              scrollBeyondLastLine: false,
              padding: { top: 14, bottom: 24 },
              renderLineHighlight: "gutter",
              smoothScrolling: true,
              cursorBlinking: "smooth",
              bracketPairColorization: { enabled: true },
            }}
          />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 items-center justify-center text-center">
          <div className="max-w-xs">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] text-blue-300"><span className="font-mono text-lg">&gt;_</span></div>
            <p className="text-sm font-medium text-zinc-300">Seu espaço de desenvolvimento</p>
            <p className="mt-2 text-xs leading-5 text-zinc-600">Escolha um arquivo no Explorer para começar. O conteúdo é salvo localmente enquanto você trabalha.</p>
          </div>
        </div>
      )}
    </section>
  );
}
