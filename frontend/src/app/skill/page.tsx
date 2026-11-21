import Layout from '@/components/Layout';
import { PageTitle } from '@/components/PageTitle';
import { Section } from '@/components/Section';
import { SectionTitle } from '@/components/SectionTitle';
import { FeatureItem } from '@/components/FeatureItem';
import { Reveal } from '@/components/Reveal';
import { SKILL_SECTIONS } from '@/data/content';

export default function SkillPage() {
  return (
    <Layout>
      <PageTitle
        title="Technical Skill"
        description="A list of technical skills and tools I have applied in personal projects, academic coursework, and professional work."
      />
      <Section id="interests">
        {SKILL_SECTIONS.map((section, i) => (
          <div key={section.title} className={i === 0 ? '' : 'mt-12'}>
            <Reveal>
              <SectionTitle overline={section.title} title={`I'm ${section.lead}`} />
            </Reveal>
            {section.groups.map((group) => (
              <div key={group.title} className="mb-8">
                <h5>{group.title}</h5>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {group.items.map((item) => (
                    <FeatureItem key={item.name} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </Section>
    </Layout>
  );
}
