import Layout from '@/components/Layout';
import { PageTitle } from '@/components/PageTitle';
import { Section } from '@/components/Section';
import { PortfolioGrid } from '@/components/PortfolioGrid';

export default function PortfolioPage() {
  return (
    <Layout>
      <PageTitle
        title="Portfolio"
        description="A selection of projects I've developed and managed across various industries, showcasing work in AI solutions, web applications, and process automation."
      />
      <Section id="portfolio">
        <PortfolioGrid />
      </Section>
    </Layout>
  );
}
