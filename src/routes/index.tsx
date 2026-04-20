import { createFileRoute } from "@tanstack/react-router";
import { AuthCard } from "../components/auth-card";
import { BanidosTable } from "../components/banidos-table";
import { SiteShell } from "../components/site-shell";
import { SupabaseConfigCard } from "../components/supabase-config-card";
import { useAuth } from "../lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Banidos | Painel CS 1.6" },
      {
        name: "description",
        content: "Painel de banidos com busca, ordenação, paginação e detalhes em modal para servidores de CS 1.6.",
      },
      { property: "og:title", content: "Banidos | Painel CS 1.6" },
      {
        property: "og:description",
        content: "Consulte rapidamente jogadores banidos com atualização automática em tempo real.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { loading, user, displayName, roles, signOut, hasRole } = useAuth();
  const canConfigure = hasRole("fundador") || hasRole("admin");

  return (
    <SiteShell
      title="BANIDOS"
      subtitle="Painel oficial de banimentos com consulta rápida para servidores de Counter-Strike 1.6"
    >
      {loading ? (
        <section className="panel p-5 text-sm text-muted-foreground">Carregando autenticação...</section>
      ) : !user ? (
        <AuthCard />
      ) : (
        <>
          <section className="panel flex flex-wrap items-center justify-between gap-3 p-4 text-xs text-muted-foreground">
            <span>
              Logado como <strong className="text-foreground">{displayName || user.email || "usuário"}</strong> ({roles.join(", ") || "sem cargo"})
            </span>
            <button type="button" className="action-button" onClick={() => void signOut()}>
              Sair
            </button>
          </section>

          {canConfigure && <SupabaseConfigCard />}
          <BanidosTable />
        </>
      )}
    </SiteShell>
  );
}
