import { Link } from "@tanstack/react-router";
import { EditableText } from "./editable-text";
import { FounderTextEditor } from "./founder-text-editor";

type SiteShellProps = {
  title: string;
  subtitle: string;
  pageKey: string;
  children: React.ReactNode;
};

export function SiteShell({ title, subtitle, pageKey, children }: SiteShellProps) {

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8">
      <header className="panel p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <EditableText
              as="h1"
              className="tracking-wide md:text-3xl"
              entry={{
                id: `${pageKey}-shell-title`,
                label: `${title} • título da página`,
                defaultText: title,
                defaultConfig: {
                  font: "Teko",
                  size: 42,
                  weight: "800",
                  uppercase: true,
                  color: "#f4f5ff",
                },
              }}
            />
            <EditableText
              as="p"
              className="mt-1"
              entry={{
                id: `${pageKey}-shell-subtitle`,
                label: `${title} • subtítulo da página`,
                defaultText: subtitle,
                defaultConfig: {
                  font: "Rajdhani",
                  size: 18,
                  weight: "700",
                  uppercase: false,
                  color: "#d8d6ef",
                },
              }}
            />
          </div>

          <nav className="flex flex-wrap gap-2" aria-label="Navegação principal">
            <Link
              to="/"
              className="menu-link"
              activeProps={{ className: "menu-link menu-link-active" }}
            >
              <EditableText
                as="span"
                entry={{
                  id: "header-nav-banidos",
                  label: "Menu • Banidos",
                  defaultText: "Banidos",
                  defaultConfig: { font: "Teko", size: 26, weight: "800", uppercase: true },
                }}
              />
            </Link>
            <Link
              to="/suporte"
              className="menu-link"
              activeProps={{ className: "menu-link menu-link-active" }}
            >
              <EditableText
                as="span"
                entry={{
                  id: "header-nav-suporte",
                  label: "Menu • Suporte",
                  defaultText: "Suporte",
                  defaultConfig: { font: "Teko", size: 26, weight: "800", uppercase: true },
                }}
              />
            </Link>
            <Link
              to="/booster"
              className="menu-link"
              activeProps={{ className: "menu-link menu-link-active" }}
            >
              <EditableText
                as="span"
                entry={{
                  id: "header-nav-booster",
                  label: "Menu • Booster",
                  defaultText: "Booster",
                  defaultConfig: { font: "Teko", size: 26, weight: "800", uppercase: true },
                }}
              />
            </Link>
          </nav>
        </div>
      </header>

      {children}
      <FounderTextEditor />
    </main>
  );
}