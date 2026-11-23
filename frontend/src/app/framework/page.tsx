import type { Metadata } from 'next';
import Layout from '@/components/Layout';
import { PageTitle } from '@/components/PageTitle';
import { ServiceGroups } from '@/components/ServiceGroups';
import { frameworkPage } from '@/lib/content';

export const metadata: Metadata = { title: `${frameworkPage.heading} | Tech Portfolio` };

export default function FrameworkPage() {
  return (
    <Layout active="/framework">
      <PageTitle title={frameworkPage.heading} intro={frameworkPage.intro} />

      <section className="services section">
        <ServiceGroups groups={frameworkPage.groups} />
      </section>
    </Layout>
  );
}
