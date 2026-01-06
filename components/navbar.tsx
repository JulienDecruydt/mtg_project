"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";

export const Navbar = () => {
  const pathname = usePathname();

  type NavLink = { href: string; label: string; icon: string };
  const links: NavLink[] = [
    { href: "/", label: "My Cards", icon: "🃏" },
    { href: "/decks", label: "My Decks", icon: "📚" },
    { href: "/search", label: "Search", icon: "🔍" },
  ];

  // Hide navbar on pages with their own back button
  if (pathname === "/search/results" || pathname === "/card") {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-lg border-t border-default-200 safe-area-bottom">
      <div className="flex justify-around items-center px-4 py-3 max-w-lg mx-auto">
        {links.map((link) => (
          <NextLink
            key={link.href}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 ${
              pathname === link.href
                ? "bg-primary text-primary-foreground scale-105 shadow-md"
                : "text-default-500 hover:text-default-900 hover:bg-default-100"
            }`}
            href={link.href}
          >
            <span className="text-lg">{link.icon}</span>
            <span className="text-xs font-medium">{link.label}</span>
          </NextLink>
        ))}
      </div>
    </nav>
  );
};
