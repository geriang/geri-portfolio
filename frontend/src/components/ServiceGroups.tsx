import React from 'react';
import { Icon } from './Icon';
import { Reveal } from './Reveal';
import { SectionTitle } from './SectionTitle';
import type { ServiceGroup } from '@/lib/content';

/**
 * Blocks of centred service cards (accent icon tile, title, copy), used by the
 * Framework page. Reproduces the template's `.services` rows, including the
 * inverted accent state on hover.
 */
export function ServiceGroups({ groups }: { groups: ServiceGroup[] }) {
  return (
    <>
      {groups.map((group, groupIndex) => (
        <div key={group.title} className={groupIndex === 0 ? '' : 'mt-12'}>
          <SectionTitle title={group.title} emphasis={group.emphasis} />
          <div className="container-page">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item, index) => (
                <Reveal key={`${group.title}-${item.title}`} delay={(index + 1) * 100}>
                  <div className="service-item">
                    <div className="icon">
                      <Icon name={item.icon} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
