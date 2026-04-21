import { useEffect } from "react";
import type { BanRecord } from "../lib/supabase";

type BanDetailsModalProps = {
  ban: BanRecord;
  onClose: () => void;
};

function getBanDurationLabel(banDate: string | null, unbanTime: string | null) {
  if (!unbanTime) return "Permanente";
  if (!banDate) return `Até ${new Date(unbanTime).toLocaleString("pt-BR")}`;

  const diffMs = new Date(unbanTime).getTime() - new Date(banDate).getTime();
  if (Number.isNaN(diffMs) || diffMs <= 0) return `Até ${new Date(unbanTime).toLocaleString("pt-BR")}`;

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return `${days}d ${hours}h ${minutes}m`;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR");
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-t border-border/60">
      <th className="w-56 bg-muted/40 px-4 py-3 text-left text-sm font-semibold text-muted-foreground">{label}</th>
      <td className="px-4 py-3 text-base text-foreground">{value}</td>
    </tr>
  );
}

export function BanDetailsModal({ ban, onClose }: BanDetailsModalProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Detalhes do banimento"
      onClick={onClose}
    >
      <div className="w-full max-w-4xl overflow-hidden rounded-xl border border-border/80 bg-card shadow-2xl animate-scale-in" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <h2 className="text-3xl font-semibold text-foreground">Banimento de {ban.player_name || "jogador"}</h2>
          <button onClick={onClose} className="text-4xl leading-none text-muted-foreground transition-colors hover:text-foreground" type="button" aria-label="Fechar detalhes">
            ×
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full border-separate border-spacing-0">
            <tbody>
              <Row label="Nick" value={ban.player_name || "-"} />
              <Row label="SteamID" value={ban.steam_id || "-"} />
              <Row label="IP" value={ban.player_ip || "-"} />
              <Row label="Servidor" value={ban.server || "-"} />
              <Row label="Motivo" value={ban.reason || "Sem motivo informado"} />
              <Row label="Banido em" value={formatDate(ban.ban_date)} />
              <Row label="Expira em" value={ban.unban_time ? formatDate(ban.unban_time) : "Permanente"} />
              <Row label="Duração" value={getBanDurationLabel(ban.ban_date, ban.unban_time)} />
              <Row label="Admin" value={ban.banned_by || "-"} />
              <Row label="Steam admin" value={ban.admin_steamid || "-"} />
              <Row label="IP admin" value={ban.admin_ip || "-"} />
              <Row label="Tipo" value={ban.ban_type || "-"} />
            </tbody>
          </table>

          <div className="flex justify-end border-t border-border/70 bg-muted/30 px-4 py-3">
            <button onClick={onClose} className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-6 text-lg font-bold text-accent-foreground transition-opacity hover:opacity-90" type="button">
              × Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}