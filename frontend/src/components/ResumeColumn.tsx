import React from 'react';
import { Reveal } from './Reveal';
import type { ResumeGroup } from '@/lib/content';

/**
 * One column of the resume timeline (accent rail, dot markers, uppercase role
 * heading, date chip, italic organisation line and bullets), reproducing the
 * template's `.resume` section.
 */
export function ResumeColumn({
  groups,
  delay = 100,
}: {
  groups: ResumeGroup[];
  delay?: number;
}) {
  return (
    <Reveal animation="fade-up" delay={delay}>
      {groups.map((group) => (
        <div key={group.title}>
          <h3 className="resume-title">{group.title}</h3>
          {group.entries.map((entry) => (
            <div key={`${group.title}-${entry.title}`} className="resume-item">
              <h4>{entry.title}</h4>
              {entry.period ? <h5>{entry.period}</h5> : null}
              {entry.summary ? <p><em>{entry.summary}</em></p> : null}
              {entry.org ? <p><em>{entry.org}</em></p> : null}
              {entry.bullets ? (
                <ul>
                  {entry.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      ))}
    </Reveal>
  );
}
