import React from 'react';
import { Reveal } from './Reveal';

export interface PageTitleProps {
  title: string;
  description: string;
}

/** Sub-page hero: large title + breadcrumb (Home / <title>). */
export function PageTitle({ title, description }: PageTitleProps) {
  return (
    <Reveal className="page-title">
      <div className="mx-auto w-full max-w-[720px] px-4">
        <h1>{title}</h1>
        <p className="mb-0">{description}</p>
        <nav aria-label="Breadcrumb" className="breadcrumbs">
          <ol>
            <li>
              <a href="/">Home</a>
            </li>
            <li aria-current="page">{title}</li>
          </ol>
        </nav>
      </div>
    </Reveal>
  );
}

export default PageTitle;
