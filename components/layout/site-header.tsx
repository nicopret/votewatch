import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/constituencies/sample-north", label: "Constituencies" },
  { href: "/authorities/sample-authority", label: "Authorities" },
  { href: "/elections/sample-election", label: "Elections" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-[color:var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <div>
          <Link href="/" className="text-lg font-semibold tracking-tight">
            VoteWatch
          </Link>
          <p className="mt-1 text-sm text-[color:var(--color-text-secondary)]">
            UK political transparency, elections, and geographic context.
          </p>
        </div>
        <nav className="hidden gap-2 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-transparent px-4 py-2 text-sm text-[color:var(--color-text-secondary)] transition hover:border-[color:var(--color-border)] hover:text-[color:var(--color-text-primary)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
