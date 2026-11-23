import React from 'react';
import { Icon } from './Icon';
import { Reveal } from './Reveal';
import type { CardGroup } from '@/lib/content';

/**
 * One labelled block of feature cards (icon + name on a surface tile), used by
 * the Technical Skill page. Reproduces the template's `.interests` rows:
 * a group heading followed by a responsive card grid.
 */
export function FeatureGroups({ groups }: { groups: CardGroup['groups'] }) {
  return (
    <>
      {groups.map((group, groupIndex) => (
        <div key={group.label} className={groupIndex === 0 ? '' : 'mt-10'}>
          <h5 className="feature-group-title">{group.label}</h5>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {group.items.map((item, index) => (
              <Reveal key={`${group.label}-${item.name}-${index}`} delay={(index + 1) * 100}>
                <div className="features-item">
                  <Icon name={item.icon} style={{ color: item.color }} />
                  <h3>{item.name}</h3>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
