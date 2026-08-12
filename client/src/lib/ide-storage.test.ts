import { describe, expect, it } from "vitest";
import { defaultPreferences } from "@/contexts/IDEContext";
import { parseSession, serializeSession, type StoredSession } from "@/lib/ide-storage";

describe("ide session storage", () => {
  const session: StoredSession = {
    id: "active-session",
    files: [{ id: "root", name: "project", path: "/", kind: "folder", children: [] }],
    preferences: defaultPreferences,
    updatedAt: 123,
  };

  it("serializes and parses a valid session", () => {
    expect(parseSession(serializeSession(session))).toEqual(session);
  });

  it("rejects a malformed backup", () => {
    expect(() => parseSession(JSON.stringify({ files: "not-an-array", preferences: {} }))).toThrow("Arquivo de sessão inválido");
  });
});
