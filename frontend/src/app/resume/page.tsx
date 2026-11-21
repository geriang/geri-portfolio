import Layout from '@/components/Layout';
import { PageTitle } from '@/components/PageTitle';
import { Section } from '@/components/Section';
import { ResumeItem } from '@/components/ResumeItem';
import { Reveal } from '@/components/Reveal';
import { RESUME } from '@/data/content';

export default function ResumePage() {
  // Live layout: Summary + Education on the left, Professional Experience on the
  // right.
  const left = RESUME.slice(0, 2);
  const right = RESUME.slice(2);

  return (
    <Layout>
      <PageTitle
        title="Resume"
        description="Relevant work experience and education for an AI product manager role."
      />
      <Section id="resume">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <Reveal>
            {left.map((col) => (
              <div key={col.heading} className="mb-6">
                <h3 className="resume-title">{col.heading}</h3>
                {col.entries.map((entry, i) => (
                  <ResumeItem key={i} entry={entry} />
                ))}
              </div>
            ))}
          </Reveal>
          <Reveal delay={100}>
            {right.map((col) => (
              <div key={col.heading} className="mb-6">
                <h3 className="resume-title">{col.heading}</h3>
                {col.entries.map((entry, i) => (
                  <ResumeItem key={i} entry={entry} />
                ))}
              </div>
            ))}
          </Reveal>
        </div>
      </Section>
    </Layout>
  );
}
