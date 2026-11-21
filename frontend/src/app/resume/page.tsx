import Layout from '@/components/Layout';
import { PageTitle } from '@/components/PageTitle';
import { Reveal } from '@/components/Reveal';
import { RESUME, type ResumeItem } from '@/data/content';

function Item({ item }: { item: ResumeItem }) {
  return (
    <div className="resume-item relative -mt-0.5 border-l-2 border-accent pb-5 pl-5 before:absolute before:-left-[9px] before:top-0 before:h-4 before:w-4 before:rounded-full before:border-2 before:border-accent before:bg-page before:content-[''] last:pb-0">
      <h4 className="mb-2.5 text-lg font-semibold uppercase leading-[18px] text-white/80">{item.heading}</h4>
      {item.period && <h5 className="mb-2.5 inline-block bg-white/10 px-[15px] py-[5px] text-base font-semibold">{item.period}</h5>}
      {item.org && (
        <p>
          <em dangerouslySetInnerHTML={{ __html: item.org }} />
        </p>
      )}
      {item.paragraphs?.map(p => (
        <p key={p}>{p}</p>
      ))}
      {item.bullets && (
        <ul className="list-disc pl-5">
          {item.bullets.map(b => (
            <li key={b} className="pb-2.5">
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const TITLE = 'resume-title mb-5 mt-5 text-[26px] font-bold text-white';

export default function ResumePage() {
  return (
    <Layout>
      <PageTitle title="Resume" description="Relevant work experience and education for an AI Product Manager Role." />
      <section id="resume" className="bg-page py-[60px]">
        <div className="container">
          <div className="row">
            <div className="col-lg-6" data-aos="fade-up" data-aos-delay="100">
              <h3 className={TITLE}>Summary</h3>
              <Item item={{ heading: RESUME.summary.name, org: '', paragraphs: [RESUME.summary.text] }} />
              <h3 className={TITLE}>Education</h3>
              {RESUME.education.map(e => (
                <Item key={e.heading} item={e} />
              ))}
            </div>
            <div className="col-lg-6" data-aos="fade-up" data-aos-delay="200">
              <h3 className={TITLE}>Professional Experience</h3>
              {RESUME.experience.map(e => (
                <Item key={e.heading} item={e} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
