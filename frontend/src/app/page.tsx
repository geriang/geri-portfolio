import Layout from '@/components/Layout';

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="hero section bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4" data-aos="zoom-out" data-aos-delay="100">
          <h2 className="text-4xl font-bold mb-4">Geri Ang</h2>
          <p className="text-2xl font-poppins mb-2">
            AI/GenAI Product <span className="text-blue-400">Strategist, Manager, Owner, Builder</span>
          </p>
          <p className="text-gray-400 mb-6 hero-note">
            Built and maintained through agentic coding — an AI-driven workflow automating this site's development.
          </p>
          <div className="social-links flex justify-center space-x-4">
            <a href="https://www.linkedin.com/in/gerillima/" className="text-white hover:text-blue-400 transition-colors" aria-label="LinkedIn">
              <span role="img" aria-label="LinkedIn">🔗</span>
            </a>
            <a href="https://github.com/geriang" className="text-white hover:text-blue-400 transition-colors" aria-label="GitHub">
              <span role="img" aria-label="GitHub">🐙</span>
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
