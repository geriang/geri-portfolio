import Layout from '@/components/Layout';

const skillItems = [
  {
    category: 'Frontend',
    items: [
      { name: 'Bootstrap', color: '#7e12f9', icon: 'layout' },
      { name: 'VanillaJS', color: '#f5dd1b', icon: 'fileTypeJs' },
      { name: 'ReactJS', color: '#01d8ff', icon: 'fileTypeJs' },
      { name: 'VueJS', color: '#3fb984', icon: 'fileTypeJs' },
    ],
  },
  {
    category: 'Backend',
    items: [
      { name: 'NodeJS', color: '#56a643', icon: 'fileTypeJs' },
      { name: 'ExpressJS', color: '#fafafa', icon: 'fileTypeJs' },
    ],
  },
  {
    category: 'Database',
    items: [
      { name: 'MySQL', color: '#4479a1', icon: 'database' },
      { name: 'MongoDB', color: '#439934', icon: 'database' },
    ],
  },
  {
    category: 'Cloud',
    items: [
      { name: 'Azure', color: '#0089d6', icon: 'microsoft' },
      { name: 'Google Cloud', color: '#4285f4', icon: 'google' },
    ],
  },
  {
    category: 'Machine Learning',
    items: [
      { name: 'Python', color: '#376fa0', icon: 'fileTypePy' },
      { name: 'GenAI / LLM', color: '#10a37f', icon: 'robot' },
      { name: 'PySpark', color: '#e25a1c', icon: 'lightning' },
    ],
  },
];

const toolItems = [
  {
    category: 'Product Development',
    items: [
      { name: 'Github', color: '#f6f6f6', icon: 'github' },
      { name: 'Gitlab', color: '#e24329', icon: 'gitBranch' },
      { name: 'Jira', color: '#2684ff', icon: 'window' },
      { name: 'Figma', color: '#a259ff', icon: 'pencil' },
      { name: 'Balsamiq', color: '#cf0a2c', icon: 'pencil' },
      { name: 'Agentic Coding', color: '#00b894', icon: 'cpu' },
    ],
  },
];

const certificationItems = [
  { name: 'CSPO', color: '#009fda', icon: 'certificate' },
];

const kaggleItems = [
  { name: 'Intro to ML', color: '#20beff', icon: 'graduationCap' },
  { name: 'Intermediate ML', color: '#20beff', icon: 'graduationCap' },
  { name: 'Feature Engineering', color: '#20beff', icon: 'slidersH' },
  { name: 'Time Series', color: '#20beff', icon: 'graph' },
  { name: 'ML Explainability', color: '#20beff', icon: 'lightbulb' },
];

const gcpItems = [
  { name: 'Cloud Foundations', color: '#4285f4', icon: 'cloud' },
  { name: 'AI & ML on GCP', color: '#4285f4', icon: 'cloud' },
  { name: 'Launching into ML', color: '#4285f4', icon: 'cloud' },
];

const languageItems = [
  { name: 'English', color: '#dc3545', icon: 'translate' },
  { name: 'Mandarin', color: '#f39c12', icon: 'translate' },
  { name: 'Korean (TOPIK 3)', color: '#2ecc71', icon: 'translate' },
];

export default function SkillPage() {
  return (
    <Layout>
      {/* Page Title */}
      <div className="page-title mb-8">
        <div className="heading">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col items-center text-center">
              <div className="max-w-2xl">
                <h1 className="text-3xl font-bold mb-2">Technical Skill</h1>
                <p className="text-gray-600 mb-0">
                  A list of technical skills and tools I have applied in personal projects, academic coursework, and professional work.
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
              <li className="text-foreground font-medium">Technical Skill</li>
            </ol>
          </div>
        </nav>
      </div>

      {/* Interests Section */}
      <section id="interests" className="interests section py-12">
        {/* Tech Stack */}
        <div className="container section-title mb-6">
          <h2 className="text-2xl font-bold mb-2">Tech Stack</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>I'm</span>
            <span className="font-semibold">Familiar with</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          {skillItems.map((group) => (
            <div key={group.category} className="mb-8">
              <h5 className="text-lg font-semibold text-foreground mb-4">{group.category}</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {group.items.map((item) => (
                  <div
                    key={item.name}
                    className="features-item p-4 rounded border border-gray-200 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded mb-2" style={{ backgroundColor: item.color, color: item.color === '#fafafa' ? '#000' : '#fff' }}>
                      {item.name.charAt(0)}
                    </div>
                    <h3 className="text-sm font-medium text-foreground mb-1 no-underline">
                      <a href="" className={`text-${item.color === '#fafafa' ? 'gray-900' : 'foreground'} hover:no-underline no-underline`}>
                        {item.name}
                      </a>
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Tools */}
        <div className="container section-title mt-12 mb-6">
          <h2 className="text-2xl font-bold mb-2">Tools</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>I'm</span>
            <span className="font-semibold">Familiar with</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          {toolItems.map((group) => (
            <div key={group.category} className="mb-8">
              <h5 className="text-lg font-semibold text-foreground mb-4">{group.category}</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {group.items.map((item) => (
                  <div
                    key={item.name}
                    className="features-item p-4 rounded border border-gray-200 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="w-8 h-8 flex items-center justify-center rounded mb-2" style={{ backgroundColor: item.color, color: item.color === '#fafafa' ? '#000' : '#fff' }}>
                      {item.name.charAt(0)}
                    </div>
                    <h3 className="text-sm font-medium text-foreground mb-1">
                      <a href="" className="no-underline">
                        {item.name}
                      </a>
                    </h3>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Certifications & Languages */}
        <div className="container section-title mt-12 mb-6">
          <h2 className="text-2xl font-bold mb-2">Certifications &amp; Languages</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>I'm</span>
            <span className="font-semibold">Certified &amp; Fluent in</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h5 className="text-lg font-semibold text-foreground mb-4">Certifications</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {certificationItems.map((item) => (
                <div
                  key={item.name}
                  className="features-item p-4 rounded border border-gray-200 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded mb-2" style={{ backgroundColor: item.color, color: '#fff' }}>
                    {item.name.charAt(0)}
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1">
                    <a href="" className="no-underline">
                      {item.name}
                    </a>
                  </h3>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h5 className="text-lg font-semibold text-foreground mb-4">Machine Learning (Kaggle)</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kaggleItems.map((item) => (
                <div
                  key={item.name}
                  className="features-item p-4 rounded border border-gray-200 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded mb-2" style={{ backgroundColor: item.color, color: '#fff' }}>
                    {item.name.charAt(0)}
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1">
                    <a href="" className="no-underline">
                      {item.name}
                    </a>
                  </h3>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h5 className="text-lg font-semibold text-foreground mb-4">Google Cloud</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {gcpItems.map((item) => (
                <div
                  key={item.name}
                  className="features-item p-4 rounded border border-gray-200 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded mb-2" style={{ backgroundColor: item.color, color: '#fff' }}>
                    {item.name.charAt(0)}
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1">
                    <a href="" className="no-underline">
                      {item.name}
                    </a>
                  </h3>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h5 className="text-lg font-semibold text-foreground mb-4">Languages</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {languageItems.map((item) => (
                <div
                  key={item.name}
                  className="features-item p-4 rounded border border-gray-200 bg-white hover:shadow-md transition-shadow"
                >
                  <div className="w-8 h-8 flex items-center justify-center rounded mb-2" style={{ backgroundColor: item.color, color: '#fff' }}>
                    {item.name.charAt(0)}
                  </div>
                  <h3 className="text-sm font-medium text-foreground mb-1">
                    <a href="" className="no-underline">
                      {item.name}
                    </a>
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
