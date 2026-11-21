import { type ReactNode } from 'react';

export interface SectionProps {
  children: ReactNode;
  id?: string;
}

/** A centred, max-width page section with vertical padding. */
export function Section({ children, id }: SectionProps) {
  return (
    <section id={id} className="section">
      <div className="mx-auto w-full max-w-[1140px] px-4">{children}</div>
    </section>
  );
}

export default Section;
