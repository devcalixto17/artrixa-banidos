import { Link } from "@tanstack/react-router";

type SiteShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function SiteShell({ title, subtitle, children }: SiteShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8">
      <header className="panel p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wide text-foreground md:text-3xl">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <nav className="flex flex-wrap gap-2" aria-label="Navegação principal">
            <Link
              to="/"
              className="menu-link"
              activeProps={{ className: "menu-link menu-link-active" }}
            >
              Banidos
            </Link>
            <Link
              to="/suporte"
              className="menu-link"
              activeProps={{ className: "menu-link menu-link-active" }}
            >
              Suporte
            </Link>
            <Link
              to="/booster"
              className="menu-link"
              activeProps={{ className: "menu-link menu-link-active" }}
            >
              Booster
            </Link>
          </nav>
        </div>
      </header>

      {children}
    </main>
  );
}