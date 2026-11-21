import Layout from '@/components/Layout';

export default function Home() {
  return (
    <Layout>
      <section id="hero" className="hero section dark-background">
        <div className="container" data-aos="zoom-out" data-aos-delay="100">
          <h2>Geri Ang</h2>
          <p>AI/GenAI Product <span className="typed" data-typed-items="Strategist, Manager, Owner, Builder"></span></p>
          <p className="hero-note">Built and maintained through agentic coding — an AI-driven workflow automating this site's development.</p>
          <div className="social-links">
            <a href="https://www.linkedin.com/in/gerillima/"><i className="bi bi-linkedin"></i></a>
            <a href="https://github.com/geriang"><i className="bi bi-github"></i></a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
