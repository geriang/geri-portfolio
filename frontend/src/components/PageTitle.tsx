import React from 'react';
import Link from 'next/link';

export function PageTitle({ title, description }: { title: string; description: string }) {
  return (
    <div id="page-title" className="bg-page" data-aos="fade">
      <div className="border-t border-white/10 pt-[160px] pb-20">
        <div className="container">
          <div className="row d-flex justify-content-center text-center">
            <div className="col-lg-8">
              <h1 className="text-[38px] font-bold">{title}</h1>
              <p className="mb-0">{description}</p>
            </div>
          </div>
        </div>
      </div>
      <nav aria-label="Breadcrumb" className="breadcrumbs bg-white/10 py-5">
        <ol className="container">
          <li>
            <Link href="/">Home</Link>
          </li>
          <li className="pl-2.5 before:pr-2.5 before:text-white/30 before:content-['/']">{title}</li>
        </ol>
      </nav>
    </div>
  );
}

export function SectionTitle({ eyebrow, lead, emphasis }: { eyebrow: string; lead: string; emphasis: string }) {
  return (
    <div className="pb-[60px]">
      <h2 className="m-0 flex items-center p-0 text-[14px] font-medium uppercase leading-none tracking-[1.5px] text-white/50">
        {eyebrow}
        <span className="mx-2.5 inline-block h-px w-[120px] bg-accent" />
      </h2>
      <div className="font-heading text-[28px] font-bold uppercase text-white">
        <span>{lead}</span> <span className="text-accent">{emphasis}</span>
      </div>
    </div>
  );
}
