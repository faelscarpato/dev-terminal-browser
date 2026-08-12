export interface DevTerminalExtension {
  id: string;
  name: string;
  version: string;
  description?: string;
  permissions: Array<"filesystem:read" | "filesystem:write" | "terminal:command">;
  commands?: Array<{ id: string; title: string }>;
  enabled: boolean;
}

const STORAGE_KEY = "devterminal.extensions";

export function validateExtensionManifest(value: unknown): DevTerminalExtension {
  if (!value || typeof value !== "object") throw new Error("Manifesto inválido.");
  const manifest = value as Partial<DevTerminalExtension>;
  if (typeof manifest.id !== "string" || !/^[a-z0-9][a-z0-9.-]{1,63}$/.test(manifest.id)) throw new Error("O manifesto precisa de um id seguro.");
  if (typeof manifest.name !== "string" || !manifest.name.trim()) throw new Error("O manifesto precisa de um nome.");
  if (typeof manifest.version !== "string" || !manifest.version.trim()) throw new Error("O manifesto precisa de uma versão.");
  const permissions = Array.isArray(manifest.permissions) ? manifest.permissions.filter((permission): permission is DevTerminalExtension["permissions"][number] => ["filesystem:read", "filesystem:write", "terminal:command"].includes(permission as string)) : [];
  return { id: manifest.id, name: manifest.name.trim(), version: manifest.version.trim(), description: typeof manifest.description === "string" ? manifest.description.trim() : undefined, permissions, commands: Array.isArray(manifest.commands) ? manifest.commands.filter((command) => command && typeof command.id === "string" && typeof command.title === "string") : [], enabled: false };
}

export function listExtensions(): DevTerminalExtension[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DevTerminalExtension[]) : [];
  } catch {
    return [];
  }
}

export function saveExtension(manifest: DevTerminalExtension) {
  const extensions = listExtensions().filter((extension) => extension.id !== manifest.id);
  extensions.push(manifest);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(extensions));
  return extensions;
}

export function setExtensionEnabled(id: string, enabled: boolean) {
  const extensions = listExtensions().map((extension) => extension.id === id ? { ...extension, enabled } : extension);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(extensions));
  return extensions;
}
