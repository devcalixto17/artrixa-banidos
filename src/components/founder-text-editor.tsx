import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../lib/auth";
import { useTextCustomization } from "../lib/text-customization";

const FONT_OPTIONS = ["Orbitron", "Exo 2", "Rajdhani", "Teko", "Audiowide"];

export function FounderTextEditor() {
  const { hasRole } = useAuth();
  const { entries, getConfig, updateEntry, selectionMode, setSelectionMode, editingEntryId, closeEditor } = useTextCustomization();
  const isFounder = hasRole("fundador");
  const [draft, setDraft] = useState<ReturnType<typeof getConfig> | null>(null);

  const selectedEntry = useMemo(() => {
    if (!entries.length) return null;
    const preferredId = editingEntryId ?? entries[0]?.id;
    return entries.find((entry) => entry.id === preferredId) ?? entries[0];
  }, [entries, editingEntryId]);

  const config = selectedEntry ? getConfig(selectedEntry) : null;

  useEffect(() => {
    if (!config || !editingEntryId) {
      setDraft(null);
      return;
    }
    setDraft(config);
  }, [config, editingEntryId]);

  const closeModal = () => {
    setDraft(null);
    closeEditor();
  };

  if (!isFounder) {
    return null;
  }

  return (
    <aside className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <button type="button" className="action-button" onClick={() => setSelectionMode(!selectionMode)}>
        {selectionMode ? "Selecionando texto..." : "Editar textos"}
      </button>

      {selectionMode && (
        <div className="panel w-[min(92vw,360px)] space-y-2 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Modo seleção ativo</p>
          <p className="text-sm text-muted-foreground">Clique no texto da página que você quer editar.</p>
        </div>
      )}

      {editingEntryId && selectedEntry && draft && (
        <div className="panel w-[min(92vw,360px)] space-y-3 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Editor de texto (fundador)</p>
          <p className="text-sm text-foreground">{selectedEntry.label}</p>

              <label className="space-y-1 text-xs text-muted-foreground">
                Texto
                <input
                  value={draft.text}
                  onChange={(event) => setDraft((prev) => (prev ? { ...prev, text: event.target.value } : prev))}
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none ring-ring focus:ring-2"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1 text-xs text-muted-foreground">
                  Cor
                  <input
                    type="color"
                    value={draft.color}
                    onChange={(event) => setDraft((prev) => (prev ? { ...prev, color: event.target.value } : prev))}
                    className="h-10 w-full rounded-lg border border-input bg-background p-1"
                  />
                </label>
                <label className="space-y-1 text-xs text-muted-foreground">
                  Tamanho ({draft.size}px)
                  <input
                    type="range"
                    min={14}
                    max={72}
                    value={draft.size}
                    onChange={(event) => setDraft((prev) => (prev ? { ...prev, size: Number(event.target.value) } : prev))}
                    className="h-10 w-full"
                  />
                </label>
              </div>

              <label className="space-y-1 text-xs text-muted-foreground">
                Fonte
                <select
                  value={draft.font}
                  onChange={(event) => setDraft((prev) => (prev ? { ...prev, font: event.target.value } : prev))}
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
                  onClick={() => setDraft((prev) => (prev ? { ...prev, weight: "500" } : prev))}
                >
                  Leve
                </button>
                <button
                  type="button"
                  className="action-button"
                  onClick={() => setDraft((prev) => (prev ? { ...prev, weight: "700" } : prev))}
                >
                  Forte
                </button>
                <button
                  type="button"
                  className="action-button"
                  onClick={() => setDraft((prev) => (prev ? { ...prev, weight: "800" } : prev))}
                >
                  Extra
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  className="action-button"
                  onClick={() => setDraft((prev) => (prev ? { ...prev, italic: !prev.italic } : prev))}
                >
                  Itálico
                </button>
                <button
                  type="button"
                  className="action-button"
                  onClick={() => setDraft((prev) => (prev ? { ...prev, uppercase: !prev.uppercase } : prev))}
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
                    onClick={() => setDraft((prev) => (prev ? { ...prev, glow: !prev.glow } : prev))}
                  >
                    {draft.glow ? "Ativo" : "Desligado"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="color"
                    value={draft.glowColor}
                    onChange={(event) => setDraft((prev) => (prev ? { ...prev, glowColor: event.target.value } : prev))}
                    className="h-10 w-full rounded-lg border border-input bg-background p-1"
                  />
                  <input
                    type="range"
                    min={6}
                    max={40}
                    value={draft.glowIntensity}
                    onChange={(event) =>
                      setDraft((prev) => (prev ? { ...prev, glowIntensity: Number(event.target.value) } : prev))
                    }
                    className="h-10 w-full"
                  />
                </div>
              </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              className="action-button flex-1"
              onClick={() => {
                updateEntry(selectedEntry.id, draft);
                closeModal();
              }}
            >
              Salvar
            </button>
            <button type="button" className="action-button flex-1" onClick={closeModal}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}