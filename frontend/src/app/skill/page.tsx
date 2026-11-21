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
      <section id="interests" className="bg-page py-[60px]">
        {SKILL_SECTIONS.map(section => (
          <div key={section.title} className="container mb-12 max-w-[1140px] px-4">
            <div className="container section-title" data-aos="fade-up">
              <SectionTitle eyebrow={section.title} lead="I'm" emphasis={section.lead} />
            </div>
            {section.groups.map(group => (
              <div key={group.title} className="row gy-4 mb-10">
                <h5 className="mb-4 text-xl font-medium">{group.title}</h5>
                {group.items.map((item, i) => (
                  <div key={item.name} className="col-lg-3 col-md-4">
                    <Reveal delay={(i % 4) * 100}>
                      <div className="features-item flex items-center border border-white/10 bg-surface p-5 transition-colors duration-300 hover:border-accent">
                        <SkillGlyph icon={item.icon} color={item.color} />
                        <span className="font-heading text-base font-bold leading-none text-white transition-colors">
                          {item.name}
                        </span>
                      </div>
                    </Reveal>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </section>
    </Layout>
  );
}
