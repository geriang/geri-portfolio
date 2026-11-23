import React from 'react';
import { Reveal } from './Reveal';

interface SectionTitleProps {
  title: string;
  /** Second half of the line, e.g. "Familiar with" in "I'm Familiar with". */
  emphasis: string;
  /** First half of the line. */
  prefix?: string;
  className?: string;
  delay?: number;
}

/**
 * Small uppercase label with the accent rule, followed by the larger uppercase
 * line, matching the template's `.section-title`.
 */
export function SectionTitle({
  title,
  emphasis,
  prefix = "I'm",
  className = '',
  delay = 0,
}: SectionTitleProps) {
  return (
    <Reveal animation="fade-up" delay={delay} className={`container-page section-title ${className}`.trim()}>
      <h2>{title}</h2>
      <p>
        <span>{prefix}</span> <span className="description-title">{emphasis}</span>
      </p>
    </Reveal>
  );
}
