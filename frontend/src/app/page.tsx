import Layout from '@/components/Layout';
import Hero from '@/components/Hero';

export default function Home() {
  return (
    <Layout>
      <Hero />
      
      {/* About Section */}
      <section id="about" className="page-content">
        <div className="container">
          <div className="section-title">
            <h2>About Me</h2>
            <p>I am a product leader with deep expertise in AI/ML, specializing in building and scaling generative AI products. I thrive at the intersection of technology, strategy, and user experience.</p>
          </div>
          
          <div className="row">
            <div className="col-md-6">
              <div className="card mb-4">
                <h3>Professional Experience</h3>
                <p>With extensive experience in product management and development, I have led teams in building cutting-edge AI solutions that drive business value and user engagement.</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card mb-4">
                <h3>What I Do</h3>
                <p>I focus on translating complex AI capabilities into intuitive products that solve real-world problems. My approach combines strategic thinking with hands-on technical execution.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
