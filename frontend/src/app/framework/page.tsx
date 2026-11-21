import Layout from '@/components/Layout';
import { PageTitle } from '@/components/PageTitle';
import { Section } from '@/components/Section';
import { SectionTitle } from '@/components/SectionTitle';
import { ServiceItem } from '@/components/ServiceItem';
import { Reveal } from '@/components/Reveal';
import { FRAMEWORK_SECTIONS } from '@/data/content';

export default function FrameworkPage() {
  return (
    <Layout>
      <PageTitle
        title="Framework"
        description="A list of business, product management and product development frameworks I have applied in academic coursework and professional work."
      />
      <Section id="services">
        {FRAMEWORK_SECTIONS.map((section, i) => (
          <div key={section.title} className={i === 0 ? '' : 'mt-12'}>
            <Reveal>
              <SectionTitle overline={section.title} title={`I'm ${section.lead}`} />
            </Reveal>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <ServiceItem key={item.title} item={item} />
              ))}
            </div>
          </div>
        ))}
      </Section>
    </Layout>
  );
}
