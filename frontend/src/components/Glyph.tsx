import { type SkillItem } from '@/data/content';

// A compact coloured glyph standing in for a brand icon. The live site uses a
// per-tool icon font; we reproduce the "coloured glyph in a grid" look without
// pulling in a vendor icon dependency.
export interface GlyphProps {
  item: SkillItem;
}

export function Glyph({ item }: GlyphProps) {
  const initial = item.name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      className="glyph"
      style={{ backgroundColor: item.color, color: contrastText(item.color) }}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}

// Pick black or white text for legibility against the glyph colour.
function contrastText(hex: string): string {
  const c = hex.replace('#', '');
  const full = c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#000000' : '#ffffff';
}

export default Glyph;
