import Layout from '@/components/Layout';

const skills = [
  { category: 'AI/ML', items: ['Machine Learning', 'Deep Learning', 'NLP', 'Generative AI', 'LLMs', 'Computer Vision'] },
  { category: 'Product Management', items: ['Product Strategy', 'Roadmap Planning', 'Agile/Scrum', 'User Research', 'Data Analytics', 'A/B Testing'] },
  { category: 'Technical', items: ['Python', 'SQL', 'API Design', 'Cloud Platforms', 'Microservices', 'DevOps'] },
  { category: 'Leadership', items: ['Team Building', 'Stakeholder Management', 'Strategic Planning', 'Cross-functional Collaboration', 'Mentoring'] },
];

export default function SkillPage() {
  return (
    <Layout>
      <section id="hero" className="hero section dark-background" style={{ minHeight: '60vh' }}>
        <div className="container" data-aos="zoom-out" data-aos-delay="100">
          <h2>Technical Skills</h2>
          <p>My expertise spans across multiple domains</p>
        </div>
      </section>

      <section id="skills" className="page-content">
        <div className="container">
          <div className="section-title">
            <h2>Skills & Expertise</h2>
            <p>A comprehensive overview of my technical and professional capabilities</p>
          </div>

          <div className="row">
            {skills.map((skillGroup, index) => (
              <div key={index} className="col-md-6 mb-4">
                <div className="card h-100">
                  <h3 className="mb-4">{skillGroup.category}</h3>
                  <ul className="list-unstyled">
                    {skillGroup.items.map((skill, idx) => (
                      <li key={idx} className="mb-2">
                        <i className="bi bi-check-circle-fill" style={{ color: '#1e40af' }}></i>{' '}
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
