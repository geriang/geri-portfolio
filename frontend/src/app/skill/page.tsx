import Layout from '@/components/Layout';

export default function SkillPage() {
  const skillGroups = [
    {
      category: 'Tech Stack',
      subcategories: [
        {
          title: 'Frontend',
          skills: ['Bootstrap', 'VanillaJS', 'ReactJS', 'VueJS'],
        },
        {
          title: 'Backend',
          skills: ['NodeJS', 'ExpressJS'],
        },
        {
          title: 'Database',
          skills: ['MySQL', 'MongoDB'],
        },
        {
          title: 'Cloud',
          skills: ['Azure', 'Google Cloud'],
        },
        {
          title: 'Machine Learning',
          skills: ['Python', 'GenAI / LLM', 'PySpark'],
        },
      ],
    },
    {
      category: 'Tools',
      subcategories: [
        {
          title: 'Product Development',
          skills: ['Github', 'Gitlab', 'Jira', 'Figma', 'Balsamiq', 'Agentic Coding'],
        },
      ],
    },
    {
      category: 'Certifications & Languages',
      subcategories: [
        {
          title: 'Certifications',
          skills: ['CSPO'],
        },
        {
          title: 'Machine Learning (Kaggle)',
          skills: ['Intro to ML', 'Intermediate ML', 'Feature Engineering', 'Time Series', 'ML Explainability'],
        },
        {
          title: 'Google Cloud',
          skills: ['Cloud Foundations', 'AI & ML on GCP', 'Launching into ML'],
        },
        {
          title: 'Languages',
          skills: ['English', 'Mandarin', 'Korean (TOPIK 3)'],
        },
      ],
    },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Technical Skill</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-12">
          A list of technical skills and tools I have applied in personal projects, academic coursework, and professional work.
        </p>

        <div className="space-y-16">
          {skillGroups.map((group, idx) => (
            <section key={idx}>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-8 border-b border-slate-200 dark:border-slate-800 pb-2">
                {group.category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {group.subcategories.map((sub, sIdx) => (
                  <div key={sIdx} className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-4">
                      {sub.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {sub.skills.map((skill, skIdx) => (
                        <span 
                          key={skIdx} 
                          className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Layout>
  );
}
