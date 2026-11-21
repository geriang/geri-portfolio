import { type SkillItem } from '@/data/content';
import { Glyph } from './Glyph';

/** A single interest card in the skill grid (glyph + name). */
export function FeatureItem({ item }: { item: SkillItem }) {
  return (
    <div className="feature-item">
      <Glyph item={item} />
      <h3>
        <a href="#">{item.name}</a>
      </h3>
    </div>
  );
}

export default FeatureItem;
