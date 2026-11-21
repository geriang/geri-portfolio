import Layout from '@/components/Layout';
import { SocialLinks } from '@/components/SocialLinks';
import { Typed } from '@/components/Typed';
import { SITE } from '@/data/content';

export default function Home() {
  return (
    <Layout>
      <section className="flex min-h-screen items-center justify-center bg-hero px-4 py-20 text-white">
        <div className="mx-auto w-full max-w-[1140px]" data-aos="zoom-out" data-aos-delay="100">
          <h1 className="m-0 text-[32px] font-bold md:text-[64px]">{SITE.name}</h1>
          <p className="mt-[5px] mb-0 text-[20px] md:text-[26px]">
            {SITE.roleLead} <span className="typed" data-typed-items={SITE.roles.join(', ')}></span>
          </p>
          <p className="hero-note mt-5 mb-0 text-[15px] md:text-[18px]">{SITE.note}</p>
          <div className="social-links mt-[25px]">
            <SocialLinks variant="hero" />
          </div>
        </div>
      </section>
    </Layout>
  );
}
