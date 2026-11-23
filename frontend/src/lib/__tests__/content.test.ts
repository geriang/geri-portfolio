import { iconNames, type IconName } from '@/components/Icon';
import {
  frameworkPage,
  navItems,
  portfolioPage,
  resumePage,
  site,
  skillPage,
} from '@/lib/content';

/**
 * Guards against the one failure mode the type system cannot see in the icon
 * map: content asking for an icon name that was never embedded, which renders an
 * empty accent tile rather than an error.
 */
function collectIconNames(node: unknown): string[] {
  if (Array.isArray(node)) {
    return node.flatMap(collectIconNames);
  }
  if (node && typeof node === 'object') {
    const record = node as Record<string, unknown>;
    const own = typeof record.icon === 'string' ? [record.icon] : [];
    return [...own, ...Object.values(record).flatMap(collectIconNames)];
  }
  return [];
}

const PAGES = [site, navItems, skillPage, frameworkPage, resumePage, portfolioPage];

describe('content icon references', () => {
  const used = [...new Set(PAGES.flatMap(collectIconNames))];

  it('uses at least one icon per card group', () => {
    expect(used.length).toBeGreaterThan(20);
  });

  it('only references icons that are embedded in the SVG map', () => {
    const missing = used.filter((name) => !iconNames.includes(name as IconName));
    expect(missing).toEqual([]);
  });
});
