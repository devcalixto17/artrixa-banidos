import type { BanRecord } from "../lib/supabase";

type BanDetailsModalProps = {
  ban: BanRecord;
  onClose: () => void;
};

type DetailItemProps = {
  label: string;
  value: string;
};

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

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

export function BanDetailsModal({ ban, onClose }: BanDetailsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Detalhes do banimento"
    >
      <div className="panel max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-wide">Detalhes do banimento</h2>
            <p className="text-xs text-muted-foreground">Registro #{ban.id}</p>
          </div>
          <button onClick={onClose} className="action-button" type="button">
            Fechar
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailItem label="Player" value={ban.player_name || "-"} />
          <DetailItem label="Steam ID" value={ban.steam_id || "-"} />
          <DetailItem label="IP do player" value={ban.player_ip || "-"} />
          <DetailItem label="Servidor" value={ban.server || "-"} />
          <DetailItem label="Admin" value={ban.banned_by || "-"} />
          <DetailItem label="Steam ID admin" value={ban.admin_steamid || "-"} />
          <DetailItem label="IP admin" value={ban.admin_ip || "-"} />
          <DetailItem label="Tipo" value={ban.ban_type || "-"} />
          <DetailItem label="Data" value={ban.ban_date ? new Date(ban.ban_date).toLocaleString("pt-BR") : "-"} />
          <DetailItem label="Duração" value={getBanDurationLabel(ban.ban_date, ban.unban_time)} />
          <div className="sm:col-span-2">
            <DetailItem label="Motivo" value={ban.reason || "Sem motivo informado"} />
          </div>
        </div>
      </div>
    </div>
  );
}