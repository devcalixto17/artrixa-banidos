import { createFileRoute } from "@tanstack/react-router";
import { BanidosTable } from "../components/banidos-table";
import { SiteShell } from "../components/site-shell";

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
  return (
    <SiteShell
      title="BANIDOS"
      subtitle="Painel oficial de banimentos com consulta rápida para servidores de Counter-Strike 1.6"
    >
      <BanidosTable />
    </SiteShell>
  );
}
