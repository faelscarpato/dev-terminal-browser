import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type FileKind = "file" | "folder";

export interface FileNode {
  id: string;
  name: string;
  path: string;
  kind: FileKind;
  content?: string;
  language?: string;
  children?: FileNode[];
}

export interface OpenTab {
  id: string;
  fileId: string;
  dirty: boolean;
}

export interface IDEPreferences {
  editorFontSize: number;
  terminalFontSize: number;
  terminalFontFamily: string;
  terminalTheme: "midnight" | "solarized" | "mono";
  tabSize: number;
  wordWrap: "on" | "off";
  minimap: boolean;
  autosave: boolean;
}

export const defaultPreferences: IDEPreferences = {
  editorFontSize: 13,
  terminalFontSize: 13,
  terminalFontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  terminalTheme: "midnight",
  tabSize: 2,
  wordWrap: "on",
  minimap: false,
  autosave: true,
};

const initialFiles: FileNode[] = [
  {
    id: "root",
    name: "devterminal-project",
    path: "/",
    kind: "folder",
    children: [
      {
        id: "src",
        name: "src",
        path: "/src",
        kind: "folder",
        children: [
          {
            id: "index-js",
            name: "index.js",
            path: "/src/index.js",
            kind: "file",
            language: "javascript",
            content: "const message = 'Hello from DevTerminal';\nconsole.log(message);\n",
          },
        ],
      },
      {
        id: "package-json",
        name: "package.json",
        path: "/package.json",
        kind: "file",
        language: "json",
        content: '{\n  "name": "devterminal-project",\n  "private": true,\n  "scripts": {\n    "start": "node src/index.js"\n  }\n}\n',
      },
      {
        id: "readme-md",
        name: "README.md",
        path: "/README.md",
        kind: "file",
        language: "markdown",
        content: "# DevTerminal\n\nUm ambiente Node.js executado dentro do navegador.\n",
      },
    ],
  },
];

interface IDEContextValue {
  files: FileNode[];
  openTabs: OpenTab[];
  activeTabId: string | null;
  preferences: IDEPreferences;
  isDirty: boolean;
  setFiles: (files: FileNode[]) => void;
  openFile: (file: FileNode) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateFile: (fileId: string, content: string) => void;
  createFile: (parentPath: string, name: string) => void;
  createFolder: (parentPath: string, name: string) => void;
  deleteNode: (nodeId: string) => void;
  updatePreferences: (patch: Partial<IDEPreferences>) => void;
  resetProject: () => void;
}

const IDEContext = createContext<IDEContextValue | null>(null);

function languageFromName(name: string) {
  const extension = name.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    json: "json",
    md: "markdown",
    css: "css",
    html: "html",
    yml: "yaml",
    yaml: "yaml",
    sh: "shell",
  };
  return map[extension ?? ""] ?? "plaintext";
}

function findNode(nodes: FileNode[], id: string): FileNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

function findByPath(nodes: FileNode[], path: string): FileNode | null {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const found = findByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
}

function updateTree(nodes: FileNode[], updater: (node: FileNode) => FileNode | null): FileNode[] {
  return nodes.flatMap((node) => {
    const next = updater(node);
    if (next === null) return [];
    return [next.children ? { ...next, children: updateTree(next.children, updater) } : next];
  });
}

function cloneFiles(files: FileNode[]) {
  return JSON.parse(JSON.stringify(files)) as FileNode[];
}

export function IDEProvider({ children }: { children: React.ReactNode }) {
  const [files, setFilesState] = useState<FileNode[]>(initialFiles);
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<IDEPreferences>(defaultPreferences);
  const [isDirty, setIsDirty] = useState(false);

  const setFiles = useCallback((nextFiles: FileNode[]) => {
    setFilesState(cloneFiles(nextFiles));
    setIsDirty(false);
  }, []);

  const openFile = useCallback((file: FileNode) => {
    if (file.kind !== "file") return;
    setOpenTabs((tabs) => {
      const existing = tabs.find((tab) => tab.fileId === file.id);
      if (existing) {
        setActiveTabId(existing.id);
        return tabs;
      }
      const tab = { id: `tab-${file.id}`, fileId: file.id, dirty: false };
      setActiveTabId(tab.id);
      return [...tabs, tab];
    });
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setOpenTabs((tabs) => {
      const index = tabs.findIndex((tab) => tab.id === tabId);
      const nextTabs = tabs.filter((tab) => tab.id !== tabId);
      if (activeTabId === tabId) {
        setActiveTabId(nextTabs[Math.max(0, index - 1)]?.id ?? null);
      }
      return nextTabs;
    });
  }, [activeTabId]);

  const updateFile = useCallback((fileId: string, content: string) => {
    setFilesState((current) => updateTree(current, (node) => node.id === fileId ? { ...node, content } : node));
    setOpenTabs((tabs) => tabs.map((tab) => tab.fileId === fileId ? { ...tab, dirty: true } : tab));
    setIsDirty(true);
  }, []);

  const createFile = useCallback((parentPath: string, name: string) => {
    const path = `${parentPath === "/" ? "" : parentPath}/${name}`;
    const node: FileNode = { id: `file-${crypto.randomUUID()}`, name, path, kind: "file", content: "", language: languageFromName(name) };
    setFilesState((current) => updateTree(current, (item) => item.path === parentPath && item.kind === "folder" ? { ...item, children: [...(item.children ?? []), node] } : item));
    setIsDirty(true);
  }, []);

  const createFolder = useCallback((parentPath: string, name: string) => {
    const path = `${parentPath === "/" ? "" : parentPath}/${name}`;
    const node: FileNode = { id: `folder-${crypto.randomUUID()}`, name, path, kind: "folder", children: [] };
    setFilesState((current) => updateTree(current, (item) => item.path === parentPath && item.kind === "folder" ? { ...item, children: [...(item.children ?? []), node] } : item));
    setIsDirty(true);
  }, []);

  const deleteNode = useCallback((nodeId: string) => {
    setFilesState((current) => updateTree(current, (item) => item.id === nodeId ? null : item));
    setOpenTabs((tabs) => tabs.filter((tab) => tab.fileId !== nodeId));
    setIsDirty(true);
  }, []);

  const updatePreferences = useCallback((patch: Partial<IDEPreferences>) => {
    setPreferences((current) => ({ ...current, ...patch }));
  }, []);

  const resetProject = useCallback(() => {
    setFilesState(cloneFiles(initialFiles));
    setOpenTabs([]);
    setActiveTabId(null);
    setIsDirty(true);
  }, []);

  const value = useMemo<IDEContextValue>(() => ({
    files,
    openTabs,
    activeTabId,
    preferences,
    isDirty,
    setFiles,
    openFile,
    closeTab,
    setActiveTab: setActiveTabId,
    updateFile,
    createFile,
    createFolder,
    deleteNode,
    updatePreferences,
    resetProject,
  }), [files, openTabs, activeTabId, preferences, isDirty, setFiles, openFile, closeTab, updateFile, createFile, createFolder, deleteNode, updatePreferences, resetProject]);

  return <IDEContext.Provider value={value}>{children}</IDEContext.Provider>;
}

export function useIDE() {
  const context = useContext(IDEContext);
  if (!context) throw new Error("useIDE must be used inside IDEProvider");
  return context;
}

export function getNodeById(files: FileNode[], id: string) {
  return findNode(files, id);
}

export function getNodeByPath(files: FileNode[], path: string) {
  return findByPath(files, path);
}
