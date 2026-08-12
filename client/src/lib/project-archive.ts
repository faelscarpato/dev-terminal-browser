import JSZip from "jszip";
import type { FileNode } from "@/contexts/IDEContext";

function flattenFiles(nodes: FileNode[], output: Array<{ path: string; content: string }> = []) {
  for (const node of nodes) {
    if (node.kind === "file") {
      output.push({ path: node.path.replace(/^\//, ""), content: node.content ?? "" });
    } else if (node.children) {
      flattenFiles(node.children, output);
    }
  }
  return output;
}

export async function exportProjectZip(files: FileNode[], projectName = "devterminal-project") {
  const zip = new JSZip();
  for (const file of flattenFiles(files)) {
    zip.file(file.path, file.content);
  }
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${projectName}.zip`;
  anchor.click();
  URL.revokeObjectURL(url);
  return blob;
}

function getLanguage(name: string) {
  const extension = name.split(".").pop()?.toLowerCase();
  const languages: Record<string, string> = { js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript", json: "json", md: "markdown", css: "css", html: "html", yml: "yaml", yaml: "yaml", sh: "shell" };
  return languages[extension ?? ""] ?? "plaintext";
}

export async function importProjectZip(file: File): Promise<FileNode[]> {
  const zip = await JSZip.loadAsync(file);
  const root: FileNode = { id: "root", name: file.name.replace(/\.zip$/i, "") || "imported-project", path: "/", kind: "folder", children: [] };
  const folders = new Map<string, FileNode>([["/", root]]);
  const entries = Object.values(zip.files).filter((entry) => !entry.dir).sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    const normalized = entry.name.replace(/^\/+|\/+$/g, "");
    if (!normalized) continue;
    const segments = normalized.split("/");
    let parentPath = "/";
    let parent = root;

    for (let index = 0; index < segments.length - 1; index += 1) {
      const segment = segments[index];
      const nextPath = `${parentPath === "/" ? "" : parentPath}/${segment}`;
      let folder = folders.get(nextPath);
      if (!folder) {
        folder = { id: `folder-${crypto.randomUUID()}`, name: segment, path: nextPath, kind: "folder", children: [] };
        parent.children?.push(folder);
        folders.set(nextPath, folder);
      }
      parent = folder;
      parentPath = nextPath;
    }

    const name = segments.at(-1) ?? "file";
    const path = `${parentPath === "/" ? "" : parentPath}/${name}`;
    parent.children?.push({ id: `file-${crypto.randomUUID()}`, name, path, kind: "file", language: getLanguage(name), content: await entry.async("string") });
  }

  return [root];
}
