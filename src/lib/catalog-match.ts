/**
 * Match user-typed issuer + card name to a catalog card so we can link
 * UserCard.cardId and attach real offers (no bank credentials required).
 */

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Expanded issuer strings for fuzzy match (e.g. "amex" → American Express). */
function issuerSearchVariants(raw: string): string[] {
  const n = norm(raw);
  if (!n) return [];
  const set = new Set<string>([n]);
  if (/\bamex\b|^amex$/i.test(raw) || n === "amex") set.add("american express");
  if (n.includes("amex")) set.add("american express");
  if (/\bciti\b|^citi$/i.test(n) || n.startsWith("citi ")) {
    set.add("citi");
    set.add("citibank");
  }
  if (/\bchase\b/i.test(n)) set.add("chase");
  if (/\bwf\b|^wf$/i.test(n) || n.includes("wells fargo")) set.add("wells fargo");
  if (n.includes("capital one") || n === "c1") set.add("capital one");
  if (n.includes("discover")) set.add("discover");
  if (n.includes("goldman") || n.includes("apple card")) set.add("goldman sachs");
  return [...set];
}

function issuerMatches(inputIssuer: string, catalogIssuer: string): boolean {
  const ci = norm(catalogIssuer);
  for (const variant of issuerSearchVariants(inputIssuer)) {
    if (variant.length < 2) continue;
    if (ci.includes(variant) || variant.includes(ci)) return true;
  }
  return false;
}

function cardNameMatches(inputName: string, catalogCardName: string): boolean {
  const a = norm(inputName);
  const b = norm(catalogCardName);
  if (a.length < 2 || b.length < 2) return false;
  if (a === b) return true;
  if (b.includes(a) || a.includes(b)) return true;
  const ta = new Set(a.split(" ").filter((t) => t.length > 1));
  const tb = new Set(b.split(" ").filter((t) => t.length > 1));
  if (ta.size === 0 || tb.size === 0) return false;
  let overlap = 0;
  for (const t of ta) {
    if (tb.has(t)) overlap++;
    else {
      for (const u of tb) {
        if (u.includes(t) || t.includes(u)) {
          overlap++;
          break;
        }
      }
    }
  }
  const minLen = Math.min(ta.size, tb.size);
  return minLen > 0 && overlap >= Math.min(2, minLen);
}

export interface CatalogCardLite {
  id: string;
  issuer: string;
  cardName: string;
  network: string;
}

/**
 * Returns the best catalog card id if issuer + card name clearly match one product.
 */
export function pickCatalogCardId(
  issuer: string,
  cardName: string,
  catalog: CatalogCardLite[],
  preferredNetwork?: string,
): string | null {
  const candidates = catalog.filter(
    (c) => issuerMatches(issuer, c.issuer) && cardNameMatches(cardName, c.cardName),
  );
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0].id;

  if (preferredNetwork) {
    const nw = preferredNetwork.toUpperCase();
    const netMatch = candidates.filter((c) => c.network.toUpperCase() === nw);
    if (netMatch.length === 1) return netMatch[0].id;
    if (netMatch.length > 0) candidates.splice(0, candidates.length, ...netMatch);
  }

  const input = norm(cardName);
  const exact = candidates.find((c) => norm(c.cardName) === input);
  if (exact) return exact.id;

  candidates.sort((a, b) => norm(a.cardName).length - norm(b.cardName).length);
  return candidates[0].id;
}
