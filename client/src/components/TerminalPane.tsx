import { useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleDot, Maximize2, Play, RotateCcw, TerminalSquare } from "lucide-react";
import { Terminal } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Button } from "@/components/ui/button";
import { isWebContainerSupported, startShell } from "@/lib/webcontainer";
import { useIDE } from "@/contexts/IDEContext";
import "xterm/css/xterm.css";

const themes = {
  midnight: { background: "#0b0c10", foreground: "#d7dae0", cursor: "#72a7ff", selectionBackground: "#24416d", black: "#12141a", red: "#ff7b7b", green: "#86d993", yellow: "#e8d88f", blue: "#72a7ff", magenta: "#c7a3ff", cyan: "#79d7d2", white: "#d7dae0", brightBlack: "#656b78", brightWhite: "#ffffff" },
  solarized: { background: "#002b36", foreground: "#93a1a1", cursor: "#b58900", selectionBackground: "#174b57", black: "#073642", red: "#dc322f", green: "#859900", yellow: "#b58900", blue: "#268bd2", magenta: "#d33682", cyan: "#2aa198", white: "#eee8d5", brightBlack: "#586e75", brightWhite: "#fdf6e3" },
  mono: { background: "#111111", foreground: "#e6e6e6", cursor: "#ffffff", selectionBackground: "#3c3c3c", black: "#000000", red: "#d7d7d7", green: "#bdbdbd", yellow: "#f0f0f0", blue: "#aaaaaa", magenta: "#c5c5c5", cyan: "#d0d0d0", white: "#eeeeee", brightBlack: "#666666", brightWhite: "#ffffff" },
} as const;

export function TerminalPane() {
  const { files, preferences } = useIDE();
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const shellRef = useRef<Awaited<ReturnType<typeof startShell>> | null>(null);
  const [status, setStatus] = useState<"idle" | "booting" | "ready" | "error">("idle");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const terminal = new Terminal({
      theme: themes[preferences.terminalTheme],
      fontFamily: preferences.terminalFontFamily,
      fontSize: preferences.terminalFontSize,
      cursorBlink: true,
      convertEol: true,
      scrollback: 2000,
      allowProposedApi: true,
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.loadAddon(new WebLinksAddon());
    terminal.open(containerRef.current);
    fit.fit();
    terminalRef.current = terminal;
    setStatus("booting");
    terminal.write("\x1b[1;34mDevTerminal\x1b[0m  ·  inicializando ambiente Node.js...\r\n");

    let disposed = false;
    const boot = async () => {
      if (!isWebContainerSupported()) {
        terminal.write("\x1b[33mWebContainers exigem HTTPS e isolamento cross-origin (COOP/COEP).\x1b[0m\r\n");
        terminal.write("O editor e a persistência local continuam disponíveis neste navegador.\r\n\r\n");
        terminal.write("$ ");
        setStatus("error");
        return;
      }
      try {
        const shell = await startShell(files, { cols: terminal.cols, rows: terminal.rows, onData: (data) => terminal.write(data), onExit: (code) => { if (!disposed) terminal.write(`\r\n\x1b[90m[processo finalizado: ${code}]\x1b[0m\r\n$ `); } });
        if (disposed) return;
        shellRef.current = shell;
        terminal.onData((data) => shell.write(data));
        terminal.onResize(({ cols, rows }) => shell.resize(cols, rows));
        setStatus("ready");
      } catch (error) {
        terminal.write(`\x1b[31mNão foi possível iniciar o WebContainer: ${error instanceof Error ? error.message : "erro desconhecido"}\x1b[0m\r\n`);
        terminal.write("Verifique se o site está em HTTPS e se o navegador permite SharedArrayBuffer.\r\n\r\n$ ");
        setStatus("error");
      }
    };
    void boot();

    let resizeScheduled = false;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeScheduled) return;
      resizeScheduled = true;
      window.setTimeout(() => {
        resizeScheduled = false;
        fit.fit();
      }, 0);
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      disposed = true;
      resizeObserver.disconnect();
      terminal.dispose();
      terminalRef.current = null;
    };
  }, []);

  useEffect(() => {
    terminalRef.current?.options && (terminalRef.current.options.fontSize = preferences.terminalFontSize);
    if (terminalRef.current) {
      terminalRef.current.options.fontFamily = preferences.terminalFontFamily;
      terminalRef.current.options.theme = themes[preferences.terminalTheme];
    }
  }, [preferences.terminalFontFamily, preferences.terminalFontSize, preferences.terminalTheme]);

  const writeCommand = (command: string) => shellRef.current?.write(`${command}\r`);

  return (
    <section className={`${expanded ? "fixed inset-4 z-40" : "relative"} flex min-h-0 flex-col bg-[#0b0c10]`}>
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#101116] px-3">
        <div className="flex items-center gap-2"><TerminalSquare size={14} className="text-zinc-500" /><span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Terminal</span><span className="text-[10px] text-zinc-700">/bin/jsh</span><span className={`ml-1 flex items-center gap-1 text-[10px] ${status === "ready" ? "text-emerald-400" : status === "error" ? "text-amber-400" : "text-zinc-600"}`}>{status === "ready" ? <CheckCircle2 size={11} /> : <CircleDot size={11} />}{status === "ready" ? "online" : status === "booting" ? "booting" : status === "error" ? "degraded" : "offline"}</span></div>
        <div className="flex items-center gap-1"><Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[10px] text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-200" onClick={() => writeCommand("npm install")}><Play size={11} /> npm install</Button><Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-200" onClick={() => writeCommand("clear")} title="Limpar"><RotateCcw size={12} /></Button><Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-200" onClick={() => setExpanded((value) => !value)} title="Maximizar"><Maximize2 size={12} /></Button></div>
      </div>
      <div ref={containerRef} className="min-h-0 flex-1 px-3 py-2" />
    </section>
  );
}
