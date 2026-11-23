import type { Metadata } from 'next';
import Layout from '@/components/Layout';
import { PageTitle } from '@/components/PageTitle';
import { ResumeColumn } from '@/components/ResumeColumn';
import { resumePage } from '@/lib/content';

export const metadata: Metadata = { title: `${resumePage.heading} | Tech Portfolio` };

export default function ResumePage() {
  return (
    <Layout active="/resume">
      <PageTitle title={resumePage.heading} intro={resumePage.intro} />

      <section className="resume section">
        <div className="container-page">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ResumeColumn groups={resumePage.left} delay={100} />
            <ResumeColumn groups={resumePage.right} delay={200} />
          </div>
        </div>
      </section>
    </Layout>
  );
}
