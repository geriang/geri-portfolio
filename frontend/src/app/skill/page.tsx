import Layout from '@/components/Layout';
import { PageTitle, SectionTitle } from '@/components/PageTitle';
import { Reveal } from '@/components/Reveal';
import { SkillGlyph } from '@/components/SkillGlyph';
import { SKILL_SECTIONS } from '@/data/content';

export default function SkillPage() {
  return (
    <Layout>
      <PageTitle
        title="Technical Skill"
        description="A list of technical skills and tools applied in personal projects, coursework, and professional work."
      />
      <section className="bg-page py-[60px]">
        {SKILL_SECTIONS.map(section => (
          <div key={section.title} className="mx-auto mb-12 max-w-[1140px] px-4">
            <Reveal>
              <SectionTitle eyebrow={section.title} lead="I'm" emphasis={section.lead} />
            </Reveal>
            {section.groups.map(group => (
              <div key={group.title} className="mb-10">
                <h3 className="mb-4 text-xl font-medium">{group.title}</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-4">
                  {group.items.map((item, i) => (
                    <Reveal key={item.name} delay={(i % 4) * 100}>
                      <div className="flex items-center border border-white/10 bg-surface p-5 transition-colors duration-300 hover:border-accent [&:hover_span]:text-accent">
                        <SkillGlyph icon={item.icon} color={item.color} />
                        <span className="font-heading text-base font-bold leading-none text-white transition-colors">
                          {item.name}
                        </span>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>
    </Layout>
  );
}
