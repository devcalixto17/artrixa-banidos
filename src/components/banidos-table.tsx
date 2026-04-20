import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient, getSupabaseConfig, type BanRecord } from "../lib/supabase";

const PAGE_SIZE = 10;

type SortField = "id" | "ban_date";
type SortDirection = "asc" | "desc";

function formatDuration(banDate: string | null, unbanTime: string | null) {
  if (!unbanTime) return "Permanente";
  if (!banDate) return `Até ${new Date(unbanTime).toLocaleString("pt-BR")}`;

  const diffMs = new Date(unbanTime).getTime() - new Date(banDate).getTime();
  if (Number.isNaN(diffMs) || diffMs <= 0) {
    return `Até ${new Date(unbanTime).toLocaleString("pt-BR")}`;
  }

  const minutes = Math.floor(diffMs / 60000);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  return `${days}d ${hours}h ${mins}m`;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR");
}

function mapBanRecord(raw: Record<string, unknown>): BanRecord {
  return {
    id: Number(raw.id ?? 0),
    ban_type: String(raw.ban_type ?? ""),
    player_name: String(raw.player_name ?? "-"),
    steam_id: raw.player_steamid ? String(raw.player_steamid) : null,
    player_ip: raw.player_ip ? String(raw.player_ip) : null,
    server: raw.server_name ? String(raw.server_name) : null,
    reason: raw.reason ? String(raw.reason) : null,
    banned_by: raw.admin_name ? String(raw.admin_name) : null,
    admin_steamid: raw.admin_steamid ? String(raw.admin_steamid) : null,
    admin_ip: raw.admin_ip ? String(raw.admin_ip) : null,
    ban_date: raw.ban_time ? String(raw.ban_time) : null,
    unban_time: raw.unban_time ? String(raw.unban_time) : null,
    created_at: raw.created_at ? String(raw.created_at) : null,
  };
}

export function BanidosTable() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [records, setRecords] = useState<BanRecord[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selected, setSelected] = useState<BanRecord | null>(null);
  const [configVersion, setConfigVersion] = useState(0);

  const fetchBans = async () => {
    const config = getSupabaseConfig();
    const supabase = getSupabaseClient();

    if (!config.isConfigured || !supabase) {
      setErrorMessage("Configuração do Supabase ausente. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }

    const sortColumn = sortField === "ban_date" ? "ban_time" : "id";

    const { data, error } = await supabase
      .from(config.table)
      .select(
        "id, ban_type, player_name, player_steamid, player_ip, ban_time, unban_time, admin_name, admin_steamid, admin_ip, reason, server_name, created_at",
      )
      .order(sortColumn, { ascending: sortDirection === "asc" });

    if (error) {
      setErrorMessage(`Erro ao carregar banidos: ${error.message}`);
      setLoading(false);
      return;
    }

    const mapped = ((data as Record<string, unknown>[] | null) ?? []).map(mapBanRecord);
    setRecords(mapped);
    setErrorMessage(null);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    void fetchBans();
  }, [sortField, sortDirection, configVersion]);

  useEffect(() => {
    const config = getSupabaseConfig();
    const supabase = getSupabaseClient();

    if (!config.isConfigured || !supabase) {
      return;
    }

    const interval = window.setInterval(() => {
      void fetchBans();
    }, 15000);

    const channel = supabase
      .channel("banidos-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: config.table,
        },
        () => {
          void fetchBans();
        },
      )
      .subscribe();

    return () => {
      window.clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [configVersion]);

  useEffect(() => {
    const syncConfig = () => setConfigVersion((prev) => prev + 1);
    window.addEventListener("storage", syncConfig);
    window.addEventListener("supabase-config-updated", syncConfig);

    return () => {
      window.removeEventListener("storage", syncConfig);
      window.removeEventListener("supabase-config-updated", syncConfig);
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return records;

    return records.filter((item) => {
      return (
        item.player_name?.toLowerCase().includes(term) || item.steam_id?.toLowerCase().includes(term)
      );
    });
  }, [records, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [page, totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-wide">Lista de Banidos</h2>
          <p className="text-xs text-muted-foreground">Atualização automática em tempo real + refresh a cada 15s</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Buscar por player ou steamid"
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none ring-ring transition focus:ring-2"
            aria-label="Buscar por nome ou Steam ID"
          />
          <button
            type="button"
            className="action-button"
            onClick={() => {
              setSortField((prev) => (prev === "id" ? "ban_date" : "id"));
            }}
          >
            Ordenar: {sortField === "id" ? "ID" : "Data"}
          </button>
          <button
            type="button"
            className="action-button"
            onClick={() => {
              setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
            }}
          >
            Sentido: {sortDirection === "asc" ? "Crescente" : "Decrescente"}
          </button>
        </div>
      </div>

      {selected && (
        <div className="border-b border-border bg-muted/20 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">Detalhes do banimento #{selected.id}</h3>
            <button type="button" className="action-button" onClick={() => setSelected(null)}>
              Fechar detalhes
            </button>
          </div>

          <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-border bg-card p-2"><span className="text-muted-foreground">Player:</span> {selected.player_name || "-"}</div>
            <div className="rounded-lg border border-border bg-card p-2"><span className="text-muted-foreground">Steam ID:</span> {selected.steam_id || "-"}</div>
            <div className="rounded-lg border border-border bg-card p-2"><span className="text-muted-foreground">IP player:</span> {selected.player_ip || "-"}</div>
            <div className="rounded-lg border border-border bg-card p-2"><span className="text-muted-foreground">Servidor:</span> {selected.server || "-"}</div>
            <div className="rounded-lg border border-border bg-card p-2"><span className="text-muted-foreground">Admin:</span> {selected.banned_by || "-"}</div>
            <div className="rounded-lg border border-border bg-card p-2"><span className="text-muted-foreground">Steam Admin:</span> {selected.admin_steamid || "-"}</div>
            <div className="rounded-lg border border-border bg-card p-2"><span className="text-muted-foreground">IP Admin:</span> {selected.admin_ip || "-"}</div>
            <div className="rounded-lg border border-border bg-card p-2"><span className="text-muted-foreground">Tipo:</span> {selected.ban_type || "-"}</div>
            <div className="rounded-lg border border-border bg-card p-2"><span className="text-muted-foreground">Data do ban:</span> {formatDate(selected.ban_date)}</div>
            <div className="rounded-lg border border-border bg-card p-2"><span className="text-muted-foreground">Unban:</span> {formatDate(selected.unban_time)}</div>
            <div className="rounded-lg border border-border bg-card p-2"><span className="text-muted-foreground">Duração:</span> {formatDuration(selected.ban_date, selected.unban_time)}</div>
            <div className="rounded-lg border border-border bg-card p-2"><span className="text-muted-foreground">Criado em:</span> {formatDate(selected.created_at)}</div>
            <div className="rounded-lg border border-border bg-card p-2 sm:col-span-2 lg:col-span-4"><span className="text-muted-foreground">Motivo:</span> {selected.reason || `Tipo: ${selected.ban_type}`}</div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Nome do player</th>
              <th className="px-4 py-3">Steam ID</th>
              <th className="px-4 py-3">Servidor</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                  Carregando banidos...
                </td>
              </tr>
            )}

            {!loading && errorMessage && (
              <tr>
                <td className="px-4 py-6 text-destructive" colSpan={5}>
                  {errorMessage}
                </td>
              </tr>
            )}

            {!loading && !errorMessage && paged.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                  Nenhum jogador banido encontrado.
                </td>
              </tr>
            )}

            {!loading &&
              !errorMessage &&
              paged.map((ban) => (
                <tr key={ban.id} className="border-t border-border/70">
                  <td className="px-4 py-3 font-semibold">#{ban.id}</td>
                  <td className="px-4 py-3">{ban.player_name}</td>
                  <td className="px-4 py-3">{ban.steam_id || "-"}</td>
                  <td className="px-4 py-3">{ban.server || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" className="action-button" onClick={() => setSelected(ban)}>
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-border p-4 text-xs text-muted-foreground">
        <span>
          Página {page} de {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            className="action-button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
          >
            Anterior
          </button>
          <button
            type="button"
            className="action-button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
          >
            Próxima
          </button>
        </div>
      </div>

    </section>
  );
}