import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { FileNode, IDEPreferences } from "@/contexts/IDEContext";

export interface StoredSession {
  id: string;
  files: FileNode[];
  preferences: IDEPreferences;
  updatedAt: number;
}

interface DevTerminalSchema extends DBSchema {
  sessions: {
    key: string;
    value: StoredSession;
  };
}

const DB_NAME = "devterminal-local";
const DB_VERSION = 1;
const SESSION_ID = "active-session";
const FALLBACK_KEY = "devterminal.active-session";
let databasePromise: Promise<IDBPDatabase<DevTerminalSchema>> | null = null;

function getDatabase() {
  if (!databasePromise) {
    databasePromise = openDB<DevTerminalSchema>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains("sessions")) {
          database.createObjectStore("sessions");
        }
      },
    });
  }
  return databasePromise;
}

export async function saveLocalSession(session: Omit<StoredSession, "id" | "updatedAt">) {
  const record: StoredSession = { ...session, id: SESSION_ID, updatedAt: Date.now() };
  try {
    const database = await getDatabase();
    await database.put("sessions", record, SESSION_ID);
  } catch (error) {
    console.warn("IndexedDB indisponível; usando localStorage.", error);
    try {
      localStorage.setItem(FALLBACK_KEY, JSON.stringify(record));
    } catch {
      // A sessão continua disponível apenas em memória quando o armazenamento é bloqueado.
    }
  }
  return record;
}

export async function loadLocalSession(): Promise<StoredSession | null> {
  try {
    const database = await getDatabase();
    return (await database.get("sessions", SESSION_ID)) ?? null;
  } catch (error) {
    console.warn("Não foi possível ler IndexedDB; tentando localStorage.", error);
    try {
      const value = localStorage.getItem(FALLBACK_KEY);
      return value ? (JSON.parse(value) as StoredSession) : null;
    } catch {
      return null;
    }
  }
}

export async function clearLocalSession() {
  try {
    const database = await getDatabase();
    await database.delete("sessions", SESSION_ID);
  } finally {
    try {
      localStorage.removeItem(FALLBACK_KEY);
    } catch {
      // Ignore storage errors.
    }
  }
}

export function serializeSession(session: StoredSession) {
  return JSON.stringify(session);
}

export function parseSession(value: string): StoredSession {
  const parsed = JSON.parse(value) as StoredSession;
  if (!parsed || !Array.isArray(parsed.files) || typeof parsed.preferences !== "object") {
    throw new Error("Arquivo de sessão inválido.");
  }
  return parsed;
}
