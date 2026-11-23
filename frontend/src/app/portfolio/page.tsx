import type { Metadata } from 'next';
import Layout from '@/components/Layout';
import { PageTitle } from '@/components/PageTitle';
import { PortfolioGrid } from '@/components/PortfolioGrid';
import { portfolioPage } from '@/lib/content';

export const metadata: Metadata = { title: `${portfolioPage.heading} | Tech Portfolio` };

export default function PortfolioPage() {
  return (
    <Layout active="/portfolio">
      <PageTitle title={portfolioPage.heading} intro={portfolioPage.intro} />

      <section className="portfolio section">
        <PortfolioGrid />
      </section>
    </Layout>
  );
}
