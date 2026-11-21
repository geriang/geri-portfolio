import Layout from '@/components/Layout';

const projects = [
  {
    title: 'AI Product Strategy Platform',
    category: 'AI/ML',
    description: 'Developed comprehensive AI product strategy framework adopted across multiple organizations.'
  },
  {
    title: 'Generative AI Applications',
    category: 'Product Development',
    description: 'Built and launched multiple generative AI products serving thousands of users.'
  },
  {
    title: 'Agentic Coding Workflow',
    category: 'Development',
    description: 'Created automated development workflows using AI agents to accelerate product delivery.'
  },
  {
    title: 'Enterprise AI Solutions',
    category: 'Enterprise',
    description: 'Designed and implemented enterprise-grade AI solutions for complex business challenges.'
  },
  {
    title: 'Product Analytics Dashboard',
    category: 'Data Analytics',
    description: 'Built comprehensive analytics platform for product performance tracking and insights.'
  },
  {
    title: 'ML Infrastructure',
    category: 'Infrastructure',
    description: 'Established scalable ML infrastructure supporting multiple production models.'
  },
];

export default function PortfolioPage() {
  return (
    <Layout>
      <section id="hero" className="hero section dark-background" style={{ minHeight: '60vh' }}>
        <div className="container" data-aos="zoom-out" data-aos-delay="100">
          <h2>Portfolio</h2>
          <p>Selected projects and accomplishments</p>
        </div>
      </section>

      <section id="portfolio" className="page-content">
        <div className="container">
          <div className="section-title">
            <h2>My Work</h2>
            <p>A showcase of projects demonstrating my expertise in AI product development</p>
          </div>

          <div className="row">
            {projects.map((project, index) => (
              <div key={index} className="col-md-4 mb-4">
                <div className="card h-100">
                  <div className="card-body">
                    <span className="badge bg-primary mb-2">{project.category}</span>
                    <h3 className="h5 card-title mb-2">{project.title}</h3>
                    <p className="card-text text-muted">{project.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
