import { WebContainer } from "@webcontainer/api";
import type { FileNode } from "@/contexts/IDEContext";

let instancePromise: Promise<WebContainer> | null = null;

function toFileSystemTree(nodes: FileNode[]): Record<string, unknown> {
  const tree: Record<string, unknown> = {};
  for (const node of nodes) {
    if (node.kind === "file") {
      tree[node.name] = { file: { contents: node.content ?? "" } };
    } else {
      tree[node.name] = { directory: toFileSystemTree(node.children ?? []) };
    }
  }
  return tree;
}

export function isWebContainerSupported() {
  return typeof window !== "undefined" && "SharedArrayBuffer" in window && window.isSecureContext;
}

export async function bootWebContainer() {
  if (!instancePromise) {
    instancePromise = WebContainer.boot({ coep: "require-corp", workdirName: "devterminal" });
  }
  return instancePromise;
}

export async function mountProject(files: FileNode[]) {
  const container = await bootWebContainer();
  await container.mount(toFileSystemTree(files) as any);
  return container;
}

export async function startShell(
  files: FileNode[],
  options: { cols?: number; rows?: number; onData: (data: string) => void; onExit?: (code: number) => void },
) {
  const container = await mountProject(files);
  const process = await container.spawn("jsh", [], { terminal: { cols: options.cols ?? 80, rows: options.rows ?? 24 } });
  process.output.pipeTo(new WritableStream({ write(data) { options.onData(data); } })).catch(() => undefined);
  process.exit.then((code) => options.onExit?.(code));
  return {
    container,
    process,
    write(input: string) {
      const writer = process.input.getWriter();
      writer.write(input).finally(() => writer.releaseLock());
    },
    resize(cols: number, rows: number) {
      process.resize({ cols, rows });
    },
  };
}

export async function runNodeCommand(files: FileNode[], command: string, args: string[], onData: (data: string) => void) {
  const container = await mountProject(files);
  const process = await container.spawn(command, args);
  process.output.pipeTo(new WritableStream({ write(data) { onData(data); } })).catch(() => undefined);
  return process.exit;
}

export function teardownWebContainer() {
  if (instancePromise) {
    instancePromise.then((container) => container.teardown()).catch(() => undefined);
    instancePromise = null;
  }
}
