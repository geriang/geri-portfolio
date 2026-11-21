import Layout from '@/components/Layout';

const frameworks = [
  { name: 'Product Development Framework', description: 'End-to-end product development lifecycle from ideation to launch, incorporating user feedback and data-driven decision making.' },
  { name: 'AI Implementation Framework', description: 'Structured approach to integrating AI/ML solutions into products, focusing on ethical considerations and measurable outcomes.' },
  { name: 'Agile methodology', description: 'Iterative development process emphasizing collaboration, flexibility, and continuous improvement.' },
  { name: 'Design Thinking', description: 'Human-centered problem-solving approach that combines empathy, creativity, and rationality.' },
];

export default function FrameworkPage() {
  return (
    <Layout>
      <section id="hero" className="hero section dark-background" style={{ minHeight: '60vh' }}>
        <div className="container" data-aos="zoom-out" data-aos-delay="100">
          <h2>Frameworks</h2>
          <p>Methodologies and approaches that guide my work</p>
        </div>
      </section>

      <section id="frameworks" className="page-content">
        <div className="container">
          <div className="section-title">
            <h2>Frameworks & Methodologies</h2>
            <p>The structured approaches I use to deliver successful products</p>
          </div>

          <div className="row">
            {frameworks.map((framework, index) => (
              <div key={index} className="col-md-6 mb-4">
                <div className="card h-100">
                  <h3 className="mb-3">{framework.name}</h3>
                  <p className="text-muted">{framework.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
