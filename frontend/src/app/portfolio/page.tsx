'use client';

import React from 'react';
import Layout from '@/components/Layout';

type Filter = 'all' | 'app' | 'product';

const portfolioItems = [
  {
    id: 1,
    name: 'Vanilla Javascript Web App',
    desc: 'A mobile responsive web app that allows user to search for past HDB Transactions in Singapore',
    filter: 'app' as Filter,
    link: 'https://vjs.gach.work',
    image: '/images/portfolio/VJS.JPG',
  },
  {
    id: 2,
    name: 'Telegram Bot',
    desc: 'A bot that acts as a bookkeeping accountant, extracting and processing information from uploaded receipts on Telegram',
    filter: 'app' as Filter,
    link: 'https://www.linkedin.com/posts/gerillima_astica-computervision-bookkeepingautomation-activity-7121846648732848128-vARv?utm_source=share&utm_medium=member_desktop',
    image: '/images/portfolio/telegram_bot.JPG',
  },
  {
    id: 3,
    name: 'Youvr',
    desc: 'A platform that allows users to capture and create immersive 3D models of physical spaces, such as properties',
    filter: 'product' as Filter,
    link: '',
    image: '/images/portfolio/youVR4.JPG',
  },
  {
    id: 4,
    name: 'Full Stack Web App',
    desc: 'A mobile responsive property bidding website inspired by Ten-X (Proof of Concept)',
    filter: 'app' as Filter,
    link: 'https://front.gach.work',
    image: '/images/portfolio/fullstack.JPG',
  },
  {
    id: 5,
    name: 'Address Extraction Web App',
    desc: 'A web application that extracts out Singapore street addresses and outputs a csv file',
    filter: 'app' as Filter,
    link: 'https://address.gach.work',
    image: '/images/portfolio/address_extractor.JPG',
  },
  {
    id: 6,
    name: 'AISG Project',
    desc: 'A end-to-end RAG/LLM pipeline',
    filter: 'product' as Filter,
    link: '',
    image: '',
  },
  {
    id: 7,
    name: 'Property Listing Management Web App',
    desc: 'A mobile responsive web app that performs CRUD for property listing',
    filter: 'app' as Filter,
    link: 'https://vue.gach.work',
    image: '/images/portfolio/vue_app.JPG',
  },
  {
    id: 8,
    name: 'EDKP Collaboration Community',
    desc: 'A central-banking AI collaboration community supporting knowledge sharing and the flagship EDKP hackathon across central banks and regulators',
    filter: 'product' as Filter,
    link: 'https://www.bis.org/innovation/bis_open_tech_ellipse.htm',
    image: '/images/portfolio/edkp.jpeg',
    alt: 'EDKP Collaboration Community',
  },
  {
    id: 9,
    name: 'Project Danu',
    desc: 'A digital twin for financial-stability risk monitoring, integrating real-time flood-risk data through cloud ETL pipelines',
    filter: 'product' as Filter,
    link: 'https://www.bis.org/about/bisih/topics/green_finance/danu.htm',
    image: '/images/portfolio/danu.jpeg',
    alt: 'Project Danu',
  },
  {
    id: 10,
    name: 'Project Nadim',
    desc: 'A proof-of-concept for cross-border sharing of fraud patterns derived from payment-data analytics',
    filter: 'product' as Filter,
    link: 'https://www.bis.org/about/bisih/topics/suptech_regtech/nadim.htm',
    image: '/images/portfolio/nadim.jpeg',
    alt: 'Project Nadim',
  },
];

const filters = [
  { value: 'all', label: 'All' },
  { value: 'app', label: 'Application' },
  { value: 'product', label: 'Management' },
];

export default function PortfolioPage() {
  const [activeFilter, setActiveFilter] = React.useState('all');

  const filteredItems = portfolioItems.filter(
    (item) => activeFilter === 'all' || item.filter === activeFilter
  );

  return (
    <Layout>
      {/* Page Title */}
      <div className="page-title mb-8">
        <div className="heading">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col items-center text-center">
              <div className="max-w-2xl">
                <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
                <p className="text-gray-600 mb-0">
                  A selection of projects I’ve developed and managed across various industries, showcasing work in AI solutions, web applications, and process automation
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="max-w-7xl mx-auto px-4">
            <ol className="flex items-center space-x-2 text-sm text-gray-500 list-none p-0 m-0">
              <li>
                <a href="/" className="text-blue-600 hover:underline no-underline">
                  Home
                </a>
              </li>
              <li className="text-foreground font-medium">Portfolio</li>
            </ol>
          </div>
        </nav>
      </div>

      {/* Portfolio Section */}
      <section id="portfolio" className="portfolio section py-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Portfolio Filters */}
          <ul className="portfolio-filters flex justify-center space-x-2 mb-6 list-none p-0">
            {filters.map((f) => (
              <li
                key={f.value}
                onClick={() => setActiveFilter(f.value as Filter)}
                className={`px-4 py-2 rounded cursor-pointer text-sm font-medium transition-all ${
                  activeFilter === f.value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                role="button"
                tabIndex={0}
              >
                {f.label}
              </li>
            ))}
          </ul>

          {/* Portfolio Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`portfolio-item ${item.filter} group`}
              >
                <div className="portfolio-content h-full rounded overflow-hidden border border-gray-200 bg-white">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.alt || item.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                      No image
                    </div>
                  )}
                  <div className="portfolio-info p-4">
                    <h4 className="text-lg font-bold text-foreground mb-1">
                      <a href={item.link || ''} className="no-underline hover:text-blue-600">
                        {item.name}
                      </a>
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">{item.desc}</p>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="details-link text-blue-600 text-sm flex items-center gap-1 no-underline hover:underline"
                        title="More Details"
                      >
                        <span>→</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
