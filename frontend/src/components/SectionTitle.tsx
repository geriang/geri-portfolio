export interface SectionTitleProps {
  overline: string;
  title: string;
}

/**
 * Section title matching the live template: a small uppercase overline with an
 * accent underline, above a large uppercase heading.
 */
export function SectionTitle({ overline, title }: SectionTitleProps) {
  return (
    <div className="section-title">
      <p className="label">{overline}</p>
      <div className="title">{title}</div>
    </div>
  );
}

export default SectionTitle;
