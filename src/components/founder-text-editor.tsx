import { useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { useTextCustomization } from "../lib/text-customization";

const FONT_OPTIONS = ["Orbitron", "Exo 2", "Rajdhani", "Teko", "Audiowide"];

export function FounderTextEditor() {
  const { hasRole } = useAuth();
  const { entries, getConfig, updateEntry } = useTextCustomization();
  const isFounder = hasRole("fundador");
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedEntry = useMemo(() => {
    if (!entries.length) return null;
    const preferredId = selectedId ?? entries[0]?.id;
    return entries.find((entry) => entry.id === preferredId) ?? entries[0];
  }, [entries, selectedId]);

  if (!isFounder) {
    return null;
  }

  const config = selectedEntry ? getConfig(selectedEntry) : null;

  return (
    <aside className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <button type="button" className="action-button" onClick={() => setOpen((prev) => !prev)}>
        {open ? "Fechar editor" : "Editar textos"}
      </button>

      {open && (
        <div className="panel w-[min(92vw,360px)] space-y-3 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Editor de texto (fundador)</p>

          {!selectedEntry || !config ? (
            <p className="text-sm text-muted-foreground">Nenhum texto disponível nesta tela.</p>
          ) : (
            <>
              <label className="space-y-1 text-xs text-muted-foreground">
                Área de texto
                <select
                  value={selectedEntry.id}
                  onChange={(event) => setSelectedId(event.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none ring-ring focus:ring-2"
                >
                  {entries.map((entry) => (
                    <option key={entry.id} value={entry.id}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-xs text-muted-foreground">
                Texto
                <input
                  value={config.text}
                  onChange={(event) => updateEntry(selectedEntry.id, { text: event.target.value })}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none ring-ring focus:ring-2"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1 text-xs text-muted-foreground">
                  Cor
                  <input
                    type="color"
                    value={config.color}
                    onChange={(event) => updateEntry(selectedEntry.id, { color: event.target.value })}
                    className="h-10 w-full rounded-lg border border-input bg-background p-1"
                  />
                </label>
                <label className="space-y-1 text-xs text-muted-foreground">
                  Tamanho ({config.size}px)
                  <input
                    type="range"
                    min={14}
                    max={72}
                    value={config.size}
                    onChange={(event) => updateEntry(selectedEntry.id, { size: Number(event.target.value) })}
                    className="h-10 w-full"
                  />
                </label>
              </div>

              <label className="space-y-1 text-xs text-muted-foreground">
                Fonte
                <select
                  value={config.font}
                  onChange={(event) => updateEntry(selectedEntry.id, { font: event.target.value })}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none ring-ring focus:ring-2"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  className="action-button"
                  onClick={() => updateEntry(selectedEntry.id, { weight: "500" })}
                >
                  Leve
                </button>
                <button
                  type="button"
                  className="action-button"
                  onClick={() => updateEntry(selectedEntry.id, { weight: "700" })}
                >
                  Forte
                </button>
                <button
                  type="button"
                  className="action-button"
                  onClick={() => updateEntry(selectedEntry.id, { weight: "800" })}
                >
                  Extra
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  className="action-button"
                  onClick={() => updateEntry(selectedEntry.id, { italic: !config.italic })}
                >
                  Itálico
                </button>
                <button
                  type="button"
                  className="action-button"
                  onClick={() => updateEntry(selectedEntry.id, { uppercase: !config.uppercase })}
                >
                  MAIÚSCULO
                </button>
              </div>

              <div className="space-y-2 rounded-lg border border-border/70 bg-background/70 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Glow</span>
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => updateEntry(selectedEntry.id, { glow: !config.glow })}
                  >
                    {config.glow ? "Ativo" : "Desligado"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="color"
                    value={config.glowColor}
                    onChange={(event) => updateEntry(selectedEntry.id, { glowColor: event.target.value })}
                    className="h-10 w-full rounded-lg border border-input bg-background p-1"
                  />
                  <input
                    type="range"
                    min={6}
                    max={40}
                    value={config.glowIntensity}
                    onChange={(event) => updateEntry(selectedEntry.id, { glowIntensity: Number(event.target.value) })}
                    className="h-10 w-full"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  );
}