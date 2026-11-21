'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import { PageTitle } from '@/components/PageTitle';
import { Reveal } from '@/components/Reveal';
import { PROJECTS } from '@/data/content';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'app', label: 'Application' },
  { key: 'product', label: 'Management' },
] as const;

export default function PortfolioPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all');
  const visible = PROJECTS.filter(p => filter === 'all' || p.category === filter);

  return (
    <Layout>
      <PageTitle
        title="Portfolio"
        description="A selection of sample projects across AI solutions, web applications, and process automation."
      />
      <section className="bg-page py-[60px]">
        <div className="mx-auto max-w-[1140px] px-4">
          <ul className="mb-5 flex flex-wrap justify-center p-0">
            {FILTERS.map(f => (
              <li key={f.key} className="mx-2.5 mb-[5px]">
                <button
                  type="button"
                  aria-pressed={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  className={`cursor-pointer text-sm font-medium leading-none transition-colors hover:text-accent sm:text-[18px] ${
                    filter === f.key ? 'text-accent' : 'text-fg'
                  }`}
                >
                  {f.label}
                </button>
              </li>
            ))}
          </ul>
          <Reveal delay={200}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visible.map(p => (
                <div key={p.title} className="group relative h-64 overflow-hidden">
                  <div
                    className="h-full w-full transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `linear-gradient(135deg, hsl(${p.hue} 45% 22%), hsl(${p.hue} 55% 38%))` }}
                    role="img"
                    aria-label={`${p.title} placeholder image`}
                  />
                  <div className="absolute inset-0 z-[3] bg-black/60 p-[15px] opacity-0 transition-all duration-300 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
                    <h4 className="inline-block bg-accent px-2.5 py-[5px] text-sm font-normal text-white">{p.title}</h4>
                    <a
                      href={p.href}
                      title="More Details"
                      aria-label={`More details: ${p.title}`}
                      className="absolute left-1/2 top-1/2 -ml-4 -mt-4 text-3xl text-white hover:text-accent"
                    >
                      ↗
                    </a>
                    <p className="absolute inset-x-0 bottom-2.5 text-center text-base font-semibold text-white/80">{p.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
