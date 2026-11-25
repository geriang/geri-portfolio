import Layout from '@/components/Layout';

export default function PortfolioPage() {
  const projects = [
    {
      title: 'Vanilla Javascript Web App',
      description: 'A mobile responsive web app that allows user to search for past HDB Transactions in Singapore',
      link: 'https://vjs.gach.work',
      category: 'Application',
      image: 'https://via.placeholder.com/400x300?text=VanillaJS+App',
    },
    {
      title: 'Telegram Bot',
      description: 'A bot that acts as a bookkeeping accountant, extracting and processing information from uploaded receipts on Telegram',
      link: 'https://www.linkedin.com/posts/gerillima_astica-computervision-bookkeepingautomation-activity-7121846648732848128-vARv',
      category: 'Application',
      image: 'https://via.placeholder.com/400x300?text=Telegram+Bot',
    },
    {
      title: 'Youvr',
      description: 'A platform that allows users to capture and create immersive 3D models of physical spaces, such as properties',
      link: '#',
      category: 'Application',
      image: 'https://via.placeholder.com/400x300?text=YouVR',
    },
    {
      title: 'Full Stack Web App',
      description: 'A mobile responsive property bidding website inspired by Ten-X (Proof of Concept)',
      link: 'https://front.gach.work',
      category: 'Application',
      image: 'https://via.placeholder.com/400x300?text=FullStack+App',
    },
    {
      title: 'Address Extraction Web App',
      description: 'A web application that extracts out Singapore street addresses and outputs a csv file',
      link: 'https://address.gach.work',
      category: 'Application',
      image: 'https://via.placeholder.com/400x300?text=Address+Extractor',
    },
    {
      title: 'AISG Project',
      description: 'A end-to-end RAG/LLM pipeline',
      link: '#',
      category: 'Management',
      image: 'https://via.placeholder.com/400x300?text=AISG+Project',
    },
    {
      title: 'Property Listing Management Web App',
      description: 'A mobile responsive web app that performs CRUD for property listing',
      link: 'https://vue.gach.work',
      category: 'Application',
      image: 'https://via.placeholder.com/400x300?text=Vue+App',
    },
    {
      title: 'EDKP Collaboration Community',
      description: 'A central-banking AI collaboration community supporting knowledge sharing and the flagship EDKP hackathon across central banks and regulators',
      link: 'https://www.bis.org/innovation/bis_open_tech_ellipse.htm',
      category: 'Management',
      image: 'https://via.placeholder.com/400x300?text=EDKP+Community',
    },
    {
      title: 'Project Danu',
      description: 'A digital twin for financial-stability risk monitoring, integrating real-time flood-risk data through cloud ETL pipelines',
      link: 'https://www.bis.org/about/bisih/topics/green_finance/danu.htm',
      category: 'Management',
      image: 'https://via.placeholder.com/400x300?text=Project+Danu',
    },
    {
      title: 'Project Nadim',
      description: 'A proof-of-concept for cross-border sharing of fraud patterns derived from payment-data analytics',
      link: 'https://www.bis.org/about/bisih/topics/suptech_regtech/nadim.htm',
      category: 'Management',
      image: 'https://via.placeholder.com/400x300?text=Project+Nadim',
    },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Portfolio</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-12">
          A selection of projects I’ve developed and managed across various industries, showcasing work in AI solutions, web applications, and process automation
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, idx) => (
            <div key={idx} className="group bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
                    {project.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {project.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3">
                  {project.description}
                </p>
                <a 
                  href={project.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                >
                  More Details
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
