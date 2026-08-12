import { useCallback, useEffect, useState } from "react";
import { IDELayout } from "@/components/IDELayout";
import { SettingsPanel } from "@/components/SettingsPanel";
import { CloudProjectsPanel } from "@/components/CloudProjectsPanel";
import { IDEProvider, useIDE, type FileNode, type IDEPreferences } from "@/contexts/IDEContext";
import { exportProjectZip, importProjectZip } from "@/lib/project-archive";
import { loadLocalSession, saveLocalSession } from "@/lib/ide-storage";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";

function IDEWorkspace() {
  const { files, preferences, setFiles, updatePreferences, isDirty } = useIDE();
  const { isAuthenticated } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cloudOpen, setCloudOpen] = useState(false);
  const [status, setStatus] = useState("restaurando sessão");
  const [cloudProjectId, setCloudProjectId] = useState<number | undefined>();
  const saveCloud = trpc.projects.save.useMutation({ onSuccess: (project) => { if (project?.id) setCloudProjectId(project.id); setStatus("sincronizado agora"); } });

  const persistLocal = useCallback(async () => {
    await saveLocalSession({ files, preferences });
    setFiles(files);
    setStatus("salvo localmente");
  }, [files, preferences, setFiles]);

  useEffect(() => {
    let active = true;
    void loadLocalSession().then((session) => {
      if (!active) return;
      if (session) {
        setFiles(session.files);
        updatePreferences(session.preferences);
        setStatus("sessão restaurada");
      } else {
        setStatus("sessão local pronta");
      }
    });
    return () => { active = false; };
  }, [setFiles, updatePreferences]);

  useEffect(() => {
    if (!preferences.autosave || !isDirty) return;
    const timeout = window.setTimeout(() => { void saveLocalSession({ files, preferences }).then(() => setStatus("autosave concluído")); }, 900);
    return () => window.clearTimeout(timeout);
  }, [files, preferences, isDirty]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const commandKey = event.metaKey || event.ctrlKey;
      if (!commandKey) return;
      if (event.key.toLowerCase() === "s") { event.preventDefault(); void persistLocal(); }
      if (event.key === ",") { event.preventDefault(); setSettingsOpen(true); }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [persistLocal]);

  const persistCloud = () => {
    if (!isAuthenticated) { startLogin(); return; }
    saveCloud.mutate({ id: cloudProjectId, name: "devterminal-project", filesJson: JSON.stringify(files), preferencesJson: JSON.stringify(preferences) });
    setStatus("sincronizando…");
  };

  const handleImport = async (file: File) => {
    try {
      const imported = await importProjectZip(file);
      setFiles(imported);
      await saveLocalSession({ files: imported, preferences });
      setStatus("projeto importado");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "falha ao importar");
    }
  };

  const handleCloudLoad = useCallback((nextFiles: FileNode[], nextPreferences: IDEPreferences) => {
    setFiles(nextFiles);
    updatePreferences(nextPreferences);
    setStatus("projeto restaurado da nuvem");
  }, [setFiles, updatePreferences]);

  return <><IDELayout onSettings={() => setSettingsOpen(true)} onCloudProjects={() => setCloudOpen(true)} onSaveLocal={() => void persistLocal()} onSaveCloud={persistCloud} onExport={() => void exportProjectZip(files)} onImport={(file) => void handleImport(file)} syncLabel={status} />{settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}{cloudOpen && <CloudProjectsPanel onClose={() => setCloudOpen(false)} onLoad={handleCloudLoad} />}</>;
}

export default function IDE() {
  return <IDEProvider><IDEWorkspace /></IDEProvider>;
}
