/**
 * Credit packs.
 *
 * Lives here rather than in the route file because a Next.js route module may
 * only export route handlers — exporting PACKS from the route made the build
 * fail with "Property 'PACKS' is incompatible with index signature". It also
 * belongs here on merit: both the API and the credits page need it, and the
 * price must come from one place the client cannot influence.
 */

export const PACKS = {
  starter: { credits: 25, cents: 9900, label: "25 product shots" },
  studio: { credits: 100, cents: 34900, label: "100 product shots" },
  scale: { credits: 500, cents: 149900, label: "500 product shots" },
} as const;

export type PackId = keyof typeof PACKS;

export const isPack = (v: unknown): v is PackId =>
  typeof v === "string" && Object.prototype.hasOwnProperty.call(PACKS, v);

/** What one generation costs. Kept beside the packs so pricing stays in one file. */
export const ENHANCE_COST = 1;
