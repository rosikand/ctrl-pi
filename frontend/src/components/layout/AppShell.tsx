import { Link, Outlet, useLocation } from "react-router-dom";
import { primaryNavigation } from "../../app/navigation";
import { classes } from "../../lib/classes";
import { StatusDot } from "../ui/StatusDot";

export function AppShell() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh bg-canvas lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <aside className="border-b border-line bg-sidebar lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex h-18 items-center px-5 lg:h-auto lg:px-6 lg:pt-8 lg:pb-9">
          <Link
            className="group flex items-center gap-3 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            to="/arms"
          >
            <span className="flex size-8 items-center justify-center rounded-md bg-brand font-mono text-lg font-semibold text-white">
              π
            </span>
            <span>
              <span className="block text-base font-semibold tracking-[-0.02em] text-ink">
                ctrl-π
              </span>
              <span className="block text-xs text-muted">
                YAM control plane
              </span>
            </span>
          </Link>
        </div>

        <nav
          aria-label="Primary"
          className="scrollbar-none flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-4 lg:pb-0"
        >
          {primaryNavigation.map((item) => {
            const isActive = pathname.startsWith(item.activePrefix);

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                className={classes(
                  "flex h-11 shrink-0 items-center rounded-md px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand lg:w-full",
                  isActive
                    ? "bg-brand-soft text-brand"
                    : "text-muted hover:bg-panel hover:text-ink",
                )}
                key={item.label}
                to={item.to}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden border-t border-line px-6 py-5 lg:block">
          <StatusDot label="Mock preview" tone="warning" />
          <p className="mt-2 text-xs leading-5 text-muted">
            API disconnected. Hardware actions are disabled.
          </p>
        </div>
      </aside>

      <main className="min-w-0">
        <div className="mx-auto flex min-h-dvh w-full max-w-[1280px] flex-col px-5 py-8 sm:px-8 sm:py-10 xl:px-12 xl:py-12">
          <div className="flex-1">
            <Outlet />
          </div>
          <footer className="mt-14 border-t border-line pt-5 text-xs text-subtle">
            <span>Milestone 1 preview · mock data · hardware actions disabled</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
