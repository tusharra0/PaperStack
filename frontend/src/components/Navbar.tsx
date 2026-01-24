import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/trade", label: "Trade" },
];

export function Navbar() {
  return (
    <header className="border-b border-border bg-background/70 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-primary">
          PaperStack
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
