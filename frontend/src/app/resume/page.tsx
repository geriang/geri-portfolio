import Layout from '@/components/Layout';

const experience = [
  {
    title: 'AI/GenAI Product Leader',
    company: 'Various Organizations',
    period: '2020 - Present',
    description: 'Leading AI product strategy and development, driving innovation in generative AI applications.'
  },
  {
    title: 'Senior Product Manager',
    company: 'Tech Companies',
    period: '2018 - 2020',
    description: 'Managed cross-functional teams to deliver enterprise software solutions and AI-powered features.'
  },
  {
    title: 'Product Manager',
    company: 'Startups & Scale-ups',
    period: '2015 - 2018',
    description: 'Built products from the ground up, establishing product-market fit and scaling user bases.'
  },
];

const education = [
  {
    degree: 'Advanced Studies in AI/ML',
    institution: 'Various Institutions',
    year: 'Ongoing'
  },
  {
    degree: 'Professional Certification',
    institution: 'Industry Leaders',
    year: '2019'
  }
];

export default function ResumePage() {
  return (
    <Layout>
      <section id="hero" className="hero section dark-background" style={{ minHeight: '60vh' }}>
        <div className="container" data-aos="zoom-out" data-aos-delay="100">
          <h2>Resume</h2>
          <p>My professional journey and qualifications</p>
        </div>
      </section>

      <section id="resume" className="page-content">
        <div className="container">
          <div className="section-title">
            <h2>Professional Experience</h2>
            <p>My career path and key accomplishments</p>
          </div>

          <div className="row">
            <div className="col-md-8 mx-auto">
              {experience.map((exp, index) => (
                <div key={index} className="card mb-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h3 className="mb-1">{exp.title}</h3>
                    <span className="badge bg-primary">{exp.period}</span>
                  </div>
                  <p className="text-muted mb-2">{exp.company}</p>
                  <p>{exp.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="section-title mt-5">
            <h2>Education & Certifications</h2>
            <p>Continuing education and professional development</p>
          </div>

          <div className="row">
            <div className="col-md-8 mx-auto">
              {education.map((edu, index) => (
                <div key={index} className="card mb-4">
                  <h3 className="mb-1">{edu.degree}</h3>
                  <p className="text-muted mb-2">{edu.institution}</p>
                  <p className="mb-0">{edu.year}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
