import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "../components/site-shell";

export const Route = createFileRoute("/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte | Painel CS 1.6" },
      {
        name: "description",
        content: "Entre em contato com o suporte do servidor para dúvidas, denúncias e revisão de banimentos.",
      },
      { property: "og:title", content: "Suporte | Painel CS 1.6" },
      {
        property: "og:description",
        content: "Canal oficial de suporte para jogadores e administradores do servidor.",
      },
    ],
  }),
  component: SuportePage,
});

function SuportePage() {
  return (
    <SiteShell
      pageKey="suporte"
      title="SUPORTE"
      subtitle="Nossa equipe está disponível para ajudar com revisões de ban, denúncias e dúvidas gerais"
    >
      <section className="panel space-y-4 p-5">
        <h2 className="text-2xl font-extrabold uppercase tracking-wide">Como falar com o suporte</h2>
        <p className="text-base font-medium text-muted-foreground md:text-lg">
          Para um atendimento mais rápido, envie seu Steam ID, horário do ocorrido e uma descrição detalhada.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-lg border border-border bg-muted/40 p-4">
            <h3 className="text-base font-extrabold uppercase">Discord</h3>
            <p className="mt-1 text-sm font-medium text-muted-foreground md:text-base">discord.gg/seu-servidor</p>
          </article>
          <article className="rounded-lg border border-border bg-muted/40 p-4">
            <h3 className="text-base font-extrabold uppercase">E-mail</h3>
            <p className="mt-1 text-sm font-medium text-muted-foreground md:text-base">suporte@seuservidor.com</p>
          </article>
          <article className="rounded-lg border border-border bg-muted/40 p-4">
            <h3 className="text-base font-extrabold uppercase">Horário</h3>
            <p className="mt-1 text-sm font-medium text-muted-foreground md:text-base">Seg a Sáb, 10h às 22h</p>
          </article>
        </div>
      </section>
    </SiteShell>
  );
}