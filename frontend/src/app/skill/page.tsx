import type { Metadata } from 'next';
import Layout from '@/components/Layout';
import { FeatureGroups } from '@/components/FeatureGroups';
import { PageTitle } from '@/components/PageTitle';
import { SectionTitle } from '@/components/SectionTitle';
import { skillPage } from '@/lib/content';

export const metadata: Metadata = { title: `${skillPage.heading} | Tech Portfolio` };

export default function SkillPage() {
  return (
    <Layout active="/skill">
      <PageTitle title={skillPage.heading} intro={skillPage.intro} />

      <section className="interests section">
        {skillPage.groups.map((group, groupIndex) => (
          <div key={group.title}>
            <SectionTitle
              title={group.title}
              emphasis={group.emphasis}
              className={groupIndex === 0 ? '' : 'mt-12'}
            />
            <div className="container-page">
              <FeatureGroups groups={group.groups} />
            </div>
          </div>
        ))}
      </section>
    </Layout>
  );
}
