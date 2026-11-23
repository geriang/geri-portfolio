import Layout from '@/components/Layout';

const education = [
  {
    degree: 'Master of Technology in Software Engineering',
    school: 'National University of Singapore, Singapore',
    detail: 'Pursuing advanced software engineering coursework (GPA 4.5/5.0).',
  },
  {
    degree: 'Diploma in Web Application Development',
    school: 'Trent Global College, Singapore',
    detail: 'Gained hands-on experience with the MERN Stack (MongoDB/MySQL, Express, React, Node.js), demonstrating the ability to collaborate effectively with developers and understand full-stack product requirements.',
  },
  {
    degree: 'Master of Business Administration, S3 Asia MBA',
    school: 'National University of Singapore, Singapore',
    detail: 'Led a winning team to first place in the Entrepreneurship and Innovation coursework project, developing a business idea from scratch, conducting market validation, and pitching to investors.',
  },
  {
    degree: 'Master of Business Administration (S3 Asia MBA, Dual Degree with NUS/FU)',
    school: 'Fudan University, China, Shanghai',
    details: [
      'Applied modelling techniques (decision trees, regression) to predict business outcomes using Excel in the Data Analysis module.',
      'Investigated work value differences across generations in China, Singapore, and South Korea by collecting and analyzing survey data (N=150) with MANOVA. This research earned the MBA Outstanding Thesis Graduate Thesis Award.',
      'Runner-up in the Mahindra War Room Competition in Mumbai, India (#2 out of 2214 participating teams).',
      'Represented Fudan University at the Integrated Leadership Case Competition held at Yale University School of Management.',
    ],
  },
  {
    degree: 'Bachelor of Arts (Psychology)',
    school: 'National University of Singapore, Singapore',
    details: [
      'Expanded my statistical skillset for data analysis using software like SPSS, applying techniques like factorial analysis (ANOVA/MANOVA) and correlation studies.',
      'Gained hands-on experience designing and conducting psychological experiments in both lab and field settings.',
      'Learnt and practiced methods for data collection, cleaning, and analysis, including identifying and addressing design and analysis issues.',
      'Collaborated on group empirical projects in Labs in Interpersonal Relationships & Labs in Clinical Psychology, enhancing my research and data analysis skills.',
    ],
  },
];

const experience = [
  {
    role: 'AI Product Owner',
    date: '2025 Apr - Present',
    company: 'BANK FOR INTERNATIONAL SETTLEMENTS INNOVATION HUB, Singapore',
    bullets: [
      'Navigated a highly unstructured landscape to identify high-impact opportunities, co-building a global central banking AI community that increased participation by 70% and aligned fragmented efforts with strategic priorities.',
      'Co-led the development and delivery of AI applications for central banking projects across the Singapore Centre\'s portfolio.',
      'Managed cross-functional stakeholders, including participating central bank partners, external vendors, and internal teams spanning Legal & Risk, Strategy & Operations, and Communications.',
      'Defined technical solutions and requirements to support project scoping, procurement, and implementation.',
    ],
  },
  {
    role: 'Associate AI Engineer',
    date: '2024 Jun - 2025 Mar',
    company: 'AI SINGAPORE, Singapore',
    bullets: [
      'Researched RAG solution architectures and proposed a solution pipeline for a European Automobile MNC.',
      'Developed an end-to-end AI information extraction RAG model for a European Automobile MNC to enhance pricing analyst productivity.',
      'Supported project management activities throughout the model development process, ensuring timely delivery and stakeholder alignment.',
    ],
  },
  {
    role: 'Director, Founding Member of Sales & Auction Department (Corporate Account)',
    date: '2022 Mar - 2024 Jun',
    company: 'HUTTONS ASIA PTE LTD, Singapore',
    bullets: [
      'Pitched and developed accounts with major Local Banks and Financial Institutions.',
      'Developed a web application to streamline address generation, reducing mailshot processes by over 50%.',
      'Developed and implemented a Telegram Bot to replace administrative data entry tasks and improved productivity.',
      'Built an email marketing system and database that achieved an average of 39% open rate and 1% click-through rate.',
    ],
  },
  {
    role: 'Associate Director',
    date: '2019 Jun - 2022 Mar',
    company: 'KF PROPERTY NETWORK PTE LTD, Singapore',
    bullets: [
      'Prospected and served local SMEs and MNCs.',
      'Independently generated approximately $200,000 SGD in gross commission over 2020 & 2021 and was ranked 33 out of 500 associates.',
    ],
  },
  {
    role: 'Product Manager',
    date: '2017 Jun - 2019 May',
    company: '3I INC, South Korea, Seoul',
    bullets: [
      'Witnessed the company’s strategic pivot to a new target market, resulting in product-market fit and sustained growth.',
      'Actively observed the decision-making process that informed the pivot, gaining insights into identifying market segments aligned with product strengths.',
      'Developed a strong understanding of market adaptation, customer segmentation, and iterative product development through firsthand experience.',
      'Introduced and championed Lean Methodology and Job-To-Be-Done framework, driving a more customer-centric approach within the startup.',
      'Reorganised the product portfolio, spearheaded new product development, conducted market research, and oversaw content creation, including instructional videos and comprehensive user manuals.',
      'Collaborated closely with the CTO and a team of software developers, serving as the vital link between client requirements and technical execution. This collaboration contributed significantly to the evolution and success of our flagship product, YouVR – a SaaS solution designed for real estate agents to create virtual tours – which later transformed into Beamo.',
    ],
  },
];

export default function ResumePage() {
  return (
    <Layout>
      {/* Page Title */}
      <div className="page-title mb-8">
        <div className="heading">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col items-center text-center">
              <div className="max-w-2xl">
                <h1 className="text-3xl font-bold mb-2">Resume</h1>
                <p className="text-gray-600 mb-0">
                  Relevant Work Experience and Education for an AI Product Manager Role
                </p>
              </div>
            </div>
          </div>
        </div>
        <nav className="breadcrumbs">
          <div className="max-w-7xl mx-auto px-4">
            <ol className="flex items-center space-x-2 text-sm text-gray-500 list-none p-0 m-0">
              <li>
                <a href="/" className="text-blue-600 hover:underline no-underline">
                  Home
                </a>
              </li>
              <li className="text-foreground font-medium">Resume</li>
            </ol>
          </div>
        </nav>
      </div>

      {/* Resume Section */}
      <section id="resume" className="resume section py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left column: Summary + Education */}
            <div className="space-y-8">
              <div>
                <h3 className="resume-title text-xl font-bold text-foreground mb-4">Summary</h3>
                <div className="resume-item pb-0">
                  <h4 className="text-lg font-bold text-foreground">Geri Ang</h4>
                  <p className="text-gray-600 italic">
                    AI product specialist with a background in business, psychology, and technology. Excels at identifying overlooked opportunities in unstructured environments and scaling existing initiatives into high-impact AI products, including a RAG-based application and a global AI community. Combines data-driven, behavioural, and systems-oriented thinking to drive adoption, align stakeholders, and operationalize AI use cases in complex institutional settings.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="resume-title text-xl font-bold text-foreground mb-4">Education</h3>
                {education.map((edu, idx) => (
                  <div key={idx} className="resume-item mb-6">
                    <h4 className="text-lg font-bold text-foreground">{edu.degree}</h4>
                    <p className="text-gray-600 italic mb-1">{edu.school}</p>
                    {edu.details ? (
                      edu.details.map((d, dIdx) => (
                        <p key={dIdx} className="text-sm text-gray-600 mb-1">
                          • {d}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm text-gray-600 mb-1">• {edu.detail}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Right column: Professional Experience */}
            <div className="space-y-8">
              <div>
                <h3 className="resume-title text-xl font-bold text-foreground mb-4">Professional Experience</h3>
                {experience.map((exp, idx) => (
                  <div key={idx} className="resume-item mb-6">
                    <h4 className="text-lg font-bold text-foreground">{exp.role}</h4>
                    <h5 className="text-sm font-medium text-blue-600 mb-1">{exp.date}</h5>
                    <p className="text-gray-600 italic mb-2">{exp.company}</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {exp.bullets.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
