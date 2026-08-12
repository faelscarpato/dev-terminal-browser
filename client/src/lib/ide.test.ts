import { describe, expect, it } from "vitest";
import { defaultPreferences } from "@/contexts/IDEContext";
import { parseSession, serializeSession, type StoredSession } from "@/lib/ide-storage";
import { validateExtensionManifest } from "@/lib/extension-registry";

describe("DevTerminal Core Logic", () => {
  const session: StoredSession = {
    id: "active-session",
    files: [{ id: "root", name: "project", path: "/", kind: "folder", children: [] }],
    preferences: defaultPreferences,
    updatedAt: 1000,
  };

  it("serializes and parses sessions correctly", () => {
    const raw = serializeSession(session);
    const parsed = parseSession(raw);
    expect(parsed).toEqual(session);
  });

  it("rejects invalid session JSON structures", () => {
    expect(() => parseSession(JSON.stringify({ files: "bad", preferences: {} }))).toThrow("Arquivo de sessão inválido.");
  });

  it("validates extension manifests with correct security rules", () => {
    const valid = validateExtensionManifest({
      id: "my-ext",
      name: "My Extension",
      version: "1.0.0",
      permissions: ["filesystem:read"],
      commands: [{ id: "cmd", title: "Run" }]
    });
    expect(valid.id).toBe("my-ext");
    expect(valid.enabled).toBe(false);

    expect(() => validateExtensionManifest({ id: "INVALID ID", name: "Bad", version: "1.0" })).toThrow();
  });
});
