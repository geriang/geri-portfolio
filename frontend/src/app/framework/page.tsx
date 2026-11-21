import Layout from '@/components/Layout';
import { PageTitle, SectionTitle } from '@/components/PageTitle';
import { Reveal } from '@/components/Reveal';
import { FRAMEWORK_SECTIONS } from '@/data/content';

export default function FrameworkPage() {
  return (
    <Layout>
      <PageTitle
        title="Framework"
        description="Business, product management and product development frameworks applied in coursework and professional work."
      />
      <section id="services" className="bg-page py-[60px]">
        <div className="container">
          {FRAMEWORK_SECTIONS.map(section => (
            <div key={section.title} className="row gy-4 mb-12">
              <div className="container section-title" data-aos="fade-up">
                <SectionTitle eyebrow={section.title} lead="I'm" emphasis="Familiar with" />
              </div>
              {section.items.map((item, i) => (
                <div key={item.title} className="col-lg-4 col-md-6">
                  <Reveal delay={(i % 3) * 100}>
                    <div className="service-item group position-relative h-full bg-surface px-5 py-20 text-center transition-all duration-300 hover:bg-accent">
                      <div className="icon relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded bg-accent transition-colors duration-300 group-hover:bg-surface">
                        <span className="absolute -left-2 -top-2 h-full w-full rounded-[5px] bg-accent/20 transition-all duration-300 group-hover:bg-black/30" />
                        <span className="relative text-2xl font-bold text-black transition-colors duration-300 group-hover:text-accent">
                          {item.title.charAt(0)}
                        </span>
                      </div>
                      <h3 className="mb-[15px] mt-2.5 text-[22px] font-bold group-hover:text-black">{item.title}</h3>
                      <p className="mb-0 text-sm leading-6 group-hover:text-black">{item.text}</p>
                    </div>
                  </Reveal>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}
