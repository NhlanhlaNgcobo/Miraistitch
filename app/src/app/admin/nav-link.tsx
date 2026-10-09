"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Nav item that knows whether it is the current section.
 *
 * `exact` exists because /admin would otherwise light up on every child route —
 * the one thing that makes a sidebar feel broken.
 */
export default function NavLink({
  href, children, exact = false, badge, badgeTone = "loud",
}: {
  href: string;
  children: React.ReactNode;
  exact?: boolean;
  badge?: number;
  badgeTone?: "loud" | "quiet";
}) {
  const path = usePathname();
  const active = exact ? path === href : path === href || path.startsWith(href + "/");

  return (
    <Link href={href} className={"ad-navitem" + (active ? " on" : "")} aria-current={active ? "page" : undefined}>
      <span>{children}</span>
      {badge !== undefined && badge > 0 && (
        <span className={"ad-badge" + (badgeTone === "quiet" ? " quiet" : "")}>{badge}</span>
      )}
    </Link>
  );
}
