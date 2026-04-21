import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "../components/site-shell";
import { useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "../lib/supabase";
import { useAuth } from "../lib/auth";
import { getServerStatus, type BoosterLiveStatus } from "../lib/booster.functions";

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
};

function mapServerRow(raw: Record<string, unknown>): BoosterServer {
  return {
    id: String(raw.id ?? crypto.randomUUID()),
    label: String(raw.label ?? "Servidor"),
    address: String(raw.address ?? ""),
    game: String(raw.game ?? "cs"),
  };
}

function BoosterPage() {
  const supabase = getSupabaseClient();
  const { loading: authLoading, user, hasRole } = useAuth();
  const isFounder = hasRole("fundador");

  const [servers, setServers] = useState<BoosterServer[]>([]);
  const [statuses, setStatuses] = useState<Record<string, BoosterLiveStatus>>({});
  const [loadingServers, setLoadingServers] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [gameInput, setGameInput] = useState("cs");

  const fetchServers = async () => {
    if (!supabase) {
      setMessage("Configure o Supabase para usar o Booster.");
      setLoadingServers(false);
      return;
    }

    const { data, error } = await supabase
      .from("booster_servers")
      .select("id, label, address, game")
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
    const results = await Promise.all(
      currentServers.map(async (server) => {
        const status = await getServerStatus({ data: { address: server.address, game: server.game } });
        return { serverId: server.id, status };
      }),
    );

    setStatuses((prev) => {
      const next = { ...prev };
      for (const item of results) {
        if (item.status.ok) {
          next[item.serverId] = item.status.data;
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

    const { error } = await supabase.from("booster_servers").insert({
      label,
      address,
      game: gameInput.trim() || "cs",
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
    await fetchServers();
  };

  const handleDeleteServer = async (serverId: string) => {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.from("booster_servers").delete().eq("id", serverId);
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
            Total: <span className="font-semibold text-foreground">{servers.length}</span> servidores • Online:{
      </section>
    </SiteShell>
  );
}