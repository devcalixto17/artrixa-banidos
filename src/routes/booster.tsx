import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "../components/site-shell";

export const Route = createFileRoute("/booster")({
  head: () => ({
    meta: [
      { title: "Booster | Painel CS 1.6" },
      {
        name: "description",
        content: "Área Booster do servidor. Página criada e pronta para expansão.",
      },
      { property: "og:title", content: "Booster | Painel CS 1.6" },
      {
        property: "og:description",
        content: "Página Booster pronta para receber conteúdo e funcionalidades futuras.",
      },
    ],
  }),
  component: BoosterPage,
});

function BoosterPage() {
  return (
    <SiteShell title="BOOSTER" subtitle="Página reservada para novidades e benefícios do servidor">
      <section className="panel p-6">
        <h2 className="text-lg font-bold uppercase tracking-wide">Em breve</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta seção já está pronta no layout e pode receber conteúdos de booster quando você quiser.
        </p>
      </section>
    </SiteShell>
  );
}