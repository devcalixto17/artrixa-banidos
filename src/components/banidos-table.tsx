import { useEffect, useMemo, useState } from "react";
import { BanDetailsModal } from "./ban-details-modal";
import { BANS_TABLE, isSupabaseConfigured, supabase, type BanRecord } from "../lib/supabase";

const PAGE_SIZE = 10;

type SortField = "id" | "ban_date";
type SortDirection = "asc" | "desc";

export function BanidosTable() {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [records, setRecords] = useState<BanRecord[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selected, setSelected] = useState<BanRecord | null>(null);

  const fetchBans = async () => {
    if (!isSupabaseConfigured) {
      setErrorMessage("Configuração do Supabase ausente. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from(BANS_TABLE)
      .select("id, player_name, steam_id, server, reason, banned_by, ban_date, ban_duration")
      .order(sortField, { ascending: sortDirection === "asc" });

    if (error) {
      setErrorMessage(`Erro ao carregar banidos: ${error.message}`);
      setLoading(false);
      return;
    }

    setRecords((data as BanRecord[]) || []);
    setErrorMessage(null);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    void fetchBans();
  }, [sortField, sortDirection]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
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
          table: BANS_TABLE,
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
            placeholder="Buscar por player ou steam_id"
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
                  <td className="px-4 py-3">{ban.steam_id}</td>
                  <td className="px-4 py-3">{ban.server}</td>
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

      {selected && <BanDetailsModal ban={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}