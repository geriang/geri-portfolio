import React from 'react';
import { Reveal } from './Reveal';

interface PageTitleProps {
  title: string;
  intro: string;
}

/**
 * Interior page banner: large centred heading over a hairline, with the
 * breadcrumb strip below it, matching the template's `.page-title`.
 */
export function PageTitle({ title, intro }: PageTitleProps) {
  return (
    <Reveal animation="fade" className="page-title">
      <div className="page-title-heading">
        <div className="container-page">
          <div className="mx-auto max-w-3xl">
            <h1>{title}</h1>
            <p className="mb-0">{intro}</p>
          </div>
        </div>
      </div>

      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <div className="container-page">
          <ol>
            <li>
              <a href="/">Home</a>
            </li>
            <li className="current">{title}</li>
          </ol>
        </div>
      </nav>
    </Reveal>
  );
}
