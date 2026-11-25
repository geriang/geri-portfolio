import Layout from '@/components/Layout';

export default function FrameworkPage() {
  const frameworkGroups = [
    {
      category: 'Business Framework',
      items: [
        {
          title: 'SWOT Analysis',
          description: 'Analyzes a business’s strengths, weaknesses, opportunities, and threats for strategic decision-making and product positioning.',
        },
        {
          title: 'Porter’s 5 forces',
          description: 'Evaluates competitive forces to understand industry dynamics and shape product strategy and market entry decisions.',
        },
        {
          title: 'Business Model Canvas',
          description: 'Visualizes a product’s business model, identifying value propositions, customer segments, and revenue streams.',
        },
        {
          title: 'Blue Ocean Strategy',
          description: 'Focuses on creating new market space and differentiating products, making competition irrelevant.',
        },
        {
          title: 'STM & 4Ps',
          description: 'Segmentation, targeting, positioning; defines product, price, place, and promotion to effectively reach target customers.',
        },
      ],
    },
    {
      category: 'Product Management Framework',
      items: [
        {
          title: 'Lean Startup Methodology',
          description: 'Validates product ideas quickly through MVPs, enabling iterative development based on customer feedback.',
        },
        {
          title: 'Design Thinking',
          description: 'Empathizes with users to ideate and prototype human-centered solutions, enhancing product innovation.',
        },
        {
          title: 'Jobs to be Done (JTBD)',
          description: 'Understands customer motivations and needs to design products that solve specific problems effectively.',
        },
        {
          title: 'Value Proposition Canvas',
          description: 'Aligns product features with customer needs, highlighting pains and gains for strategic differentiation.',
        },
      ],
    },
    {
      category: 'Product Development Framework',
      items: [
        {
          title: 'Agile - Scrum',
          description: 'Certified Scrum Product Owner (CSPO) by Scrum Alliance. Iterative development framework focusing on flexibility, continuous delivery, and collaboration for building products efficiently.',
        },
      ],
    },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Framework</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-12">
          A list of business, product management and product development frameworks I have applied in academic coursework and professional work.
        </p>

        <div className="space-y-16">
          {frameworkGroups.map((group, idx) => (
            <section key={idx}>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-8 border-b border-slate-200 dark:border-slate-800 pb-2">
                {group.category}
              </h2>
              <div className="grid grid-cols-1 gap-6">
                {group.items.map((item, iIdx) => (
                  <div key={iIdx} className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
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
