import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "../components/site-shell";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { getServerStatus, type BoosterLiveStatus } from "../lib/booster.functions";
import flagBR from "../assets/flag-br.png";
import flagUS from "../assets/flag-us.png";

export const Route = createFileRoute("/booster")({
  head: () => ({
    meta: [
      { title: "Booster | Painel CS 1.6" },
      {
        name: "description",
        content: "Painel Booster no estilo LGSL para listar servidores de CS com status em tempo real.",
      },
      { property: "og:title", content: "Booster | Painel CS 1.6" },
      {
        property: "og:description",
        content: "Cadastro de servidores por fundador e monitoramento de jogadores, mapa e status online.",
      },
    ],
  }),
  component: BoosterPage,
});

type BoosterServer = {
  id: string;
  label: string;
  address: string;
  game: string;
  country: "BR" | "ES";
};

const COUNTRY_FLAGS = {
  BR: { label: "Brasil", image: flagBR },
  ES: { label: "Gringo", image: flagUS },
} as const;

function normalizeCountry(value: unknown): "BR" | "ES" {
  return String(value ?? "BR").toUpperCase() === "ES" ? "ES" : "BR";
}

function mapServerRow(raw: Record<string, unknown>): BoosterServer {
  return {
    id: String(raw.id ?? crypto.randomUUID()),
    label: String(raw.label ?? "Servidor"),
    address: String(raw.address ?? ""),
    game: String(raw.game ?? "cs"),
    country: normalizeCountry(raw.country),
  };
}

function BoosterPage() {
  const supabase = getSupabaseClient();
  const client = supabase as any;
  const { loading: authLoading, user, hasRole } = useAuth();
  const isFounder = hasRole("fundador");

  const [servers, setServers] = useState<BoosterServer[]>([]);
  const [statuses, setStatuses] = useState<Record<string, BoosterLiveStatus>>({});
  const [loadingServers, setLoadingServers] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [gameInput, setGameInput] = useState("cs");
  const [countryInput, setCountryInput] = useState<"BR" | "ES">("BR");
  const [expandedServerId, setExpandedServerId] = useState<string | null>(null);

  const fetchServers = async () => {
    if (!supabase) {
      setMessage("Configure o Supabase para usar o Booster.");
      setLoadingServers(false);
      return;
    }

    const { data, error } = await client
      .from("booster_servers")
      .select("id, label, address, game, country")
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage("Tabela booster_servers não encontrada ou sem permissão.");
      setLoadingServers(false);
      return;
    }

    const mapped = ((data as Record<string, unknown>[] | null) ?? []).map(mapServerRow);
    setServers(mapped);
    setMessage(null);
    setLoadingServers(false);
  };

  const refreshStatuses = async (currentServers: BoosterServer[]) => {
    const results = await Promise.allSettled(
      currentServers.map(async (server) => {
        const status = await getServerStatus({ data: { address: server.address, game: server.game } });
        return { serverId: server.id, status };
      }),
    );

    setStatuses((prev) => {
      const next = { ...prev };
      for (const item of results) {
        if (item.status !== "fulfilled") {
          continue;
        }

        if (item.value.status.ok) {
          next[item.value.serverId] = item.value.status.data;
        }
      }
      return next;
    });
  };

  useEffect(() => {
    void fetchServers();
  }, []);

  useEffect(() => {
    if (!servers.length) {
      return;
    }

    void refreshStatuses(servers);
    const interval = window.setInterval(() => {
      void refreshStatuses(servers);
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [servers]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const cacheBustKey = "booster-cache-bust-v1";
    if (window.sessionStorage.getItem(cacheBustKey)) {
      return;
    }

    window.sessionStorage.setItem(cacheBustKey, "1");
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("_refresh", String(Date.now()));
    window.location.replace(nextUrl.toString());
  }, []);

  const handleAddServer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      setMessage("Configure o Supabase para usar o Booster.");
      return;
    }

    const label = labelInput.trim();
    const address = addressInput.trim();
    if (!label || !address) {
      setMessage("Preencha nome e IP:PORTA.");
      return;
    }

    const { error } = await client.from("booster_servers").insert({
      label,
      address,
      game: gameInput.trim() || "cs",
      country: countryInput,
      created_by: user?.id,
      active: true,
    });

    if (error) {
      setMessage(`Erro ao adicionar servidor: ${error.message}`);
      return;
    }

    setLabelInput("");
    setAddressInput("");
    setGameInput("cs");
    setCountryInput("BR");
    await fetchServers();
  };

  const handleDeleteServer = async (serverId: string) => {
    if (!supabase) {
      return;
    }

    const { error } = await client.from("booster_servers").delete().eq("id", serverId);
    if (error) {
      setMessage(`Erro ao remover servidor: ${error.message}`);
      return;
    }

    await fetchServers();
  };

  const onlineCount = useMemo(
    () => Object.values(statuses).filter((item) => item.status === "online").length,
    [statuses],
  );

  return (
    <SiteShell title="BOOSTER" subtitle="LGSL-style: servidores monitorados em tempo real para CS 1.6">
      <section className="panel space-y-5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-4 text-sm">
          <div className="text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{servers.length}</span> servidores • Online: <span className="font-semibold text-foreground">{onlineCount}</span>
          </div>
          <div className="text-xs text-muted-foreground">Refresh automático a cada 15s</div>
        </div>

        {message && <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">{message}</div>}

        {authLoading ? (
          <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">Carregando autenticação...</div>
          ) : isFounder ? (
            <form className="grid gap-2 border-b border-border/70 pb-5 md:grid-cols-[1fr_1fr_120px_170px_auto]" onSubmit={handleAddServer}>
            <label className="space-y-1 text-xs text-muted-foreground">
              Nome do servidor
              <input
                value={labelInput}
                onChange={(event) => setLabelInput(event.target.value)}
                placeholder="Ex: Public #1"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none ring-ring focus:ring-2"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Endereço
              <input
                value={addressInput}
                onChange={(event) => setAddressInput(event.target.value)}
                placeholder="IP:PORTA"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none ring-ring focus:ring-2"
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              Jogo
              <input
                value={gameInput}
                onChange={(event) => setGameInput(event.target.value)}
                placeholder="cs"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none ring-ring focus:ring-2"
              />
            </label>
              <div className="space-y-1 text-xs text-muted-foreground">
                País
                <div className="grid h-10 grid-cols-2 gap-1 rounded-lg border border-input bg-background p-1">
                  {(["BR", "ES"] as const).map((country) => {
                    const isActive = countryInput === country;
                    const item = COUNTRY_FLAGS[country];

                    return (
                      <button
                        key={country}
                        type="button"
                        onClick={() => setCountryInput(country)}
                        className={`flex items-center justify-center gap-1 rounded-md px-2 text-xs ${
                          isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
                        }`}
                      >
                        <img src={item.image} alt={item.label} className="h-3 w-5 rounded-[2px] border border-border object-cover" loading="lazy" />
                        <span>{country === "BR" ? "BR" : "ES"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            <div className="flex items-end">
              <button type="submit" className="action-button w-full">
                Adicionar
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
            Apenas fundador pode cadastrar/remover servidores no Booster.
          </div>
        )}

        <div className="grid gap-3">
          {loadingServers ? (
            <div className="rounded-lg border border-border bg-background px-3 py-4 text-sm text-muted-foreground">Carregando servidores...</div>
          ) : servers.length === 0 ? (
            <div className="rounded-lg border border-border bg-background px-3 py-4 text-sm text-muted-foreground">Nenhum servidor cadastrado.</div>
          ) : (
            servers.map((server) => {
              const status = statuses[server.id];
              const isOnline = status?.status === "online";
              const hasLiveStatus = Boolean(status);
              const isExpanded = expandedServerId === server.id;
              const country = COUNTRY_FLAGS[server.country];

              return (
                <article
                  key={server.id}
                  className="rounded-lg border bg-background px-4 py-3"
                  style={{
                    borderColor: hasLiveStatus
                      ? isOnline
                        ? "var(--color-status-online)"
                        : "var(--color-status-offline)"
                      : "var(--color-border)",
                    boxShadow: hasLiveStatus
                      ? isOnline
                        ? "inset 4px 0 0 var(--color-status-online)"
                        : "inset 4px 0 0 var(--color-status-offline)"
                      : "inset 4px 0 0 var(--color-border)",
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setExpandedServerId((prev) => (prev === server.id ? null : server.id))}
                      className="flex min-w-[220px] flex-1 items-center gap-3 text-left"
                    >
                      <img src={country.image} alt={country.label} className="h-4 w-6 rounded-[2px] border border-border object-cover" loading="lazy" />
                      <div>
                        <h2 className="text-base font-bold uppercase tracking-wide text-foreground">{server.label}</h2>
                        <p className="text-xs text-muted-foreground">{server.address}</p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-md border px-2 py-1 text-xs font-semibold uppercase"
                        style={{
                          borderColor: hasLiveStatus
                            ? isOnline
                              ? "var(--color-status-online)"
                              : "var(--color-status-offline)"
                            : "var(--color-border)",
                          backgroundColor: hasLiveStatus
                            ? isOnline
                              ? "color-mix(in oklab, var(--color-status-online) 28%, transparent)"
                              : "color-mix(in oklab, var(--color-status-offline) 28%, transparent)"
                            : "color-mix(in oklab, var(--color-border) 32%, transparent)",
                          color: hasLiveStatus
                            ? isOnline
                              ? "var(--color-status-online)"
                              : "var(--color-status-offline)"
                            : "var(--color-muted-foreground)",
                        }}
                      >
                        {hasLiveStatus ? (isOnline ? "Online" : "Offline") : "Conectando"}
                      </span>
                      {isFounder && (
                        <button type="button" className="action-button" onClick={() => void handleDeleteServer(server.id)}>
                          Remover
                        </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <>
                      <div className="mt-3 grid gap-2 border-t border-border/70 pt-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div className="border-b border-border/70 pb-2 sm:border-b-0 sm:pb-0">
                          <p className="text-xs text-muted-foreground">Nome real</p>
                          <p className="font-medium text-foreground">{status?.name ?? "Aguardando"}</p>
                        </div>
                        <div className="border-b border-border/70 pb-2 sm:border-b-0 sm:pb-0">
                          <p className="text-xs text-muted-foreground">Mapa</p>
                          <p className="font-medium text-foreground">{status?.map ?? "-"}</p>
                        </div>
                        <div className="border-b border-border/70 pb-2 lg:border-b-0 lg:pb-0">
                          <p className="text-xs text-muted-foreground">Jogadores</p>
                          <p className="font-medium text-foreground">
                            {typeof status?.players === "number" && typeof status.maxPlayers === "number"
                              ? `${status.players}/${status.maxPlayers}`
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Última atualização</p>
                          <p className="font-medium text-foreground">
                            {status?.updatedAt ? new Date(status.updatedAt).toLocaleTimeString("pt-BR") : "-"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 border-t border-border/70 pt-3">
                        <p className="mb-2 text-xs text-muted-foreground">Jogadores online</p>
                        {status?.playersOnline?.length ? (
                          <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                            {status.playersOnline.map((playerName, index) => (
                              <li key={`${server.id}-player-${index}`} className="text-sm text-foreground">
                                {playerName}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground">Nenhum jogador listado no momento.</p>
                        )}
                      </div>
                    </>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>
    </SiteShell>
  );
}