import type { ReactNode } from "react";

export type NavItem = {
  id: string;
  label: string;
  icon: string;
};

interface ShellProps {
  children: ReactNode;
  navItems?: NavItem[];
  activeId?: string;
  onNav?: (id: string) => void;
}

export function Shell({ children, navItems = [], activeId, onNav }: ShellProps) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex h-screen">
        <aside
          className="flex flex-col border-r h-full shrink-0"
          style={{ width: "17rem", borderColor: "var(--line)", background: "var(--panel)" }}
        >
          <div className="p-6 pb-4">
            <div className="font-bold text-xl" style={{ fontFamily: "Fraunces, serif" }}>
              Unit Converter
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
              Convert anything, instantly
            </div>
          </div>
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNav?.(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                style={{
                  background: activeId === item.id ? "var(--accent)" : "transparent",
                  color: activeId === item.id ? "#fff" : "var(--ink)",
                }}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 text-xs" style={{ color: "var(--muted)" }}>
            <a
              href="https://freeappstore.online"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: "var(--muted)" }}
            >
              Part of FreeAppStore — free forever
            </a>
          </div>
        </aside>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Mobile */}
      <div className="flex flex-col h-screen md:hidden">
        <header
          className="flex items-center px-4 h-14 border-b shrink-0"
          style={{ borderColor: "var(--line)", background: "var(--panel)" }}
        >
          <span className="font-bold text-lg" style={{ fontFamily: "Fraunces, serif" }}>
            Unit Converter
          </span>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
        <nav
          className="border-t shrink-0 overflow-x-auto"
          style={{ borderColor: "var(--line)", background: "var(--dock)" }}
        >
          <div className="flex items-center h-16 px-2 gap-1 min-w-max">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNav?.(item.id)}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all shrink-0"
                style={{
                  background: activeId === item.id ? "var(--accent)" : "transparent",
                  color: activeId === item.id ? "#fff" : "var(--muted)",
                }}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}
