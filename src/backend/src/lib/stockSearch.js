import { ci } from './dbText.js';

// Typing in a stock list: every word must match the item somewhere (its number, heat, grade, product name or
// number, or branch), in any order, so "a36 plate 96" or "jx 1/2 plate" finds the piece among thousands
// (2026-11-26: the list held the newest 500 and the rest could not be found).
export const searchWords = (text) => String(text || '').trim().split(/\s+/).filter(Boolean).slice(0, 6);
export const wordMatch = (word) => ({ OR: [
  { coilNumber: { contains: word, ...ci } },
  { heat: { heatNumber: { contains: word, ...ci } } },
  { grade: { code: { contains: word, ...ci } } },
  { product: { name: { contains: word, ...ci } } },
  { product: { sku: { contains: word, ...ci } } },
  { location: { code: { equals: word, ...ci } } },
  { location: { name: { contains: word, ...ci } } },
] });

// The store search works the same way on products: "a36 plate" finds "A36 Hot Rolled Steel Plate" (2026-11-26,
// before, the words had to appear together in that order).
export const productWordMatch = (word) => ({ OR: [
  { name: { contains: word, ...ci } }, { sku: { contains: word, ...ci } },
  { description: { contains: word, ...ci } }, { grade: { code: { contains: word, ...ci } } },
] });
