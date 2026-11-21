import Layout from '@/components/Layout';
import { SocialLinks } from '@/components/SocialLinks';
import { Typed } from '@/components/Typed';
import { Reveal } from '@/components/Reveal';
import { SITE } from '@/data/content';

export default function Home() {
  return (
    <Layout>
      <section className="hero">
        <Reveal>
          <h1>{SITE.name}</h1>
          <p className="hero-role">
            {SITE.roleLead}{' '}
            <span className="accent">
              <Typed items={SITE.roles} />
            </span>
          </p>
          <p className="hero-note">{SITE.note}</p>
          <SocialLinks variant="hero" />
        </Reveal>
      </section>
    </Layout>
  );
}
