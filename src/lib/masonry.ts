/**
 * Spread items of differing heights over N columns so the columns finish at
 * about the same height, with no column hanging below the others.
 *
 * Cards used to be dealt round-robin — 1, 2, 3, 1, 2, 3 — which with mixed
 * portrait and landscape shapes left one column hundreds of pixels short and a
 * blank patch under it. Filling the currently shortest column is the obvious
 * fix, but on its own it is myopic: the last few items can still land badly,
 * and on twelve cards it came out worse than the round-robin it replaced.
 *
 * So: fill the shortest column, then improve by moving and swapping items
 * between the tallest and shortest column while that keeps reducing the
 * spread. Each column is finally sorted by the item's original position, which
 * is what keeps the owner's numbering (01, 02, 03 ...) reading in order.
 */
export function balanceColumns<T>(
  items: T[],
  cols: number,
  heightOf: (item: T, index: number) => number,
): { item: T; index: number }[][] {
  const n = items.length;
  if (cols <= 1 || n === 0) {
    return [items.map((item, index) => ({ item, index }))].slice(0, Math.max(cols, 1));
  }

  const h = items.map((item, i) => heightOf(item, i));
  // Which column each item sits in
  const col = new Array<number>(n).fill(0);
  const totals = new Array<number>(cols).fill(0);

  // Start from the shortest-column fill
  for (let i = 0; i < n; i++) {
    let k = 0;
    for (let j = 1; j < cols; j++) if (totals[j] < totals[k] - 1e-9) k = j;
    col[i] = k;
    totals[k] += h[i];
  }

  // Any assignment is valid as long as each column ends up sorted by index,
  // which it is below — so we are free to move items to level the columns.
  const spread = () => Math.max(...totals) - Math.min(...totals);

  for (let pass = 0; pass < 60; pass++) {
    let tall = 0, short = 0;
    for (let j = 1; j < cols; j++) {
      if (totals[j] > totals[tall]) tall = j;
      if (totals[j] < totals[short]) short = j;
    }
    if (tall === short) break;

    const before = spread();
    let best: { kind: 'move'; a: number } | { kind: 'swap'; a: number; b: number } | null = null;
    let bestSpread = before;

    const tallItems = [];
    const shortItems = [];
    for (let i = 0; i < n; i++) {
      if (col[i] === tall) tallItems.push(i);
      else if (col[i] === short) shortItems.push(i);
    }

    for (const a of tallItems) {
      const after = Math.max(
        ...totals.map((v, j) => (j === tall ? v - h[a] : j === short ? v + h[a] : v))
      ) - Math.min(
        ...totals.map((v, j) => (j === tall ? v - h[a] : j === short ? v + h[a] : v))
      );
      if (after < bestSpread - 1e-9) { bestSpread = after; best = { kind: 'move', a }; }
    }

    for (const a of tallItems) {
      for (const b of shortItems) {
        if (h[a] <= h[b]) continue;  // a swap only helps when it moves height down
        const d = h[a] - h[b];
        const next = totals.map((v, j) => (j === tall ? v - d : j === short ? v + d : v));
        const after = Math.max(...next) - Math.min(...next);
        if (after < bestSpread - 1e-9) { bestSpread = after; best = { kind: 'swap', a, b }; }
      }
    }

    if (!best) break;
    if (best.kind === 'move') {
      totals[tall] -= h[best.a];
      totals[short] += h[best.a];
      col[best.a] = short;
    } else {
      const d = h[best.a] - h[best.b];
      totals[tall] -= d;
      totals[short] += d;
      col[best.a] = short;
      col[best.b] = tall;
    }
  }

  const buckets: { item: T; index: number }[][] = Array.from({ length: cols }, () => []);
  for (let i = 0; i < n; i++) buckets[col[i]].push({ item: items[i], index: i });
  // Ascending position within each column, so the numbering still reads in order
  for (const b of buckets) b.sort((x, y) => x.index - y.index);
  return buckets;
}
