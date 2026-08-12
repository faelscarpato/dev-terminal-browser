import { useState } from "react";
import { ChevronDown, ChevronRight, FileCode2, Folder, FolderOpen, MoreHorizontal, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIDE, type FileNode } from "@/contexts/IDEContext";

function TreeItem({ node, depth }: { node: FileNode; depth: number }) {
  const { openFile, activeTabId, openTabs, createFile, createFolder, deleteNode } = useIDE();
  const [expanded, setExpanded] = useState(depth === 0 || node.path === "/src");
  const active = openTabs.find((tab) => tab.id === activeTabId)?.fileId === node.id;

  const addFile = () => {
    const name = window.prompt("Nome do arquivo", "novo-arquivo.js");
    if (name?.trim()) createFile(node.path, name.trim());
  };

  const addFolder = () => {
    const name = window.prompt("Nome da pasta", "nova-pasta");
    if (name?.trim()) createFolder(node.path, name.trim());
  };

  return (
    <div>
      <div
        className={`group flex h-8 items-center gap-1 rounded-md px-2 text-[12px] transition-colors hover:bg-white/[0.06] ${active ? "bg-blue-500/15 text-blue-200" : "text-zinc-400"}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onDoubleClick={() => node.kind === "file" && openFile(node)}
        onClick={() => node.kind === "folder" ? setExpanded((value) => !value) : openFile(node)}
      >
        {node.kind === "folder" ? (
          <button className="grid h-4 w-4 place-items-center text-zinc-500" onClick={(event) => { event.stopPropagation(); setExpanded((value) => !value); }}>
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        ) : <span className="w-4" />}
        {node.kind === "folder" ? (expanded ? <FolderOpen size={14} className="text-blue-300" /> : <Folder size={14} className="text-blue-300" />) : <FileCode2 size={14} className="text-zinc-500" />}
        <span className="min-w-0 flex-1 truncate">{node.name}</span>
        {node.kind === "folder" && (
          <span className="hidden items-center gap-0.5 group-hover:flex">
            <button className="rounded p-1 hover:bg-white/10" title="Novo arquivo" onClick={(event) => { event.stopPropagation(); addFile(); }}><Plus size={12} /></button>
            <button className="rounded p-1 text-zinc-500 hover:bg-white/10" title="Mais ações" onClick={(event) => { event.stopPropagation(); addFolder(); }}><MoreHorizontal size={12} /></button>
          </span>
        )}
      </div>
      {node.kind === "folder" && expanded && node.children?.map((child) => <TreeItem key={child.id} node={child} depth={depth + 1} />)}
      {node.id !== "root" && node.kind === "file" && (
        <button className="sr-only" onClick={() => deleteNode(node.id)}>Excluir {node.name}</button>
      )}
    </div>
  );
}

export function FileExplorer() {
  const { files, createFile } = useIDE();
  const addRootFile = () => {
    const name = window.prompt("Nome do arquivo", "novo-arquivo.js");
    if (name?.trim()) createFile("/", name.trim());
  };
  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-r border-white/[0.07] bg-[#111217]">
      <div className="flex h-11 items-center justify-between border-b border-white/[0.06] px-3">
        <div className="flex items-center gap-2"><span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">Explorer</span><span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-zinc-600">{countFiles(files)}</span></div>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-200" onClick={addRootFile} title="Novo arquivo"><Plus size={15} /></Button>
      </div>
      <div className="flex-1 overflow-auto p-2">{files.map((node) => <TreeItem key={node.id} node={node} depth={0} />)}</div>
      <div className="border-t border-white/[0.06] px-3 py-2 text-[10px] text-zinc-600">Clique para abrir · duplo clique para fixar</div>
    </aside>
  );
}

function countFiles(nodes: FileNode[]): number {
  return nodes.reduce((total, node) => total + (node.kind === "file" ? 1 : countFiles(node.children ?? [])), 0);
}
