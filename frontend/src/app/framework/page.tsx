import Layout from '@/components/Layout';

const frameworkGroups = [
  {
    title: 'Business Framework',
    items: [
      {
        name: 'SWOT Analysis',
        desc: 'Analyzes a business’s strengths, weaknesses, opportunities, and threats for strategic decision-making and product positioning.',
      },
      {
        name: "Porter’s 5 forces",
        desc: 'Evaluates competitive forces to understand industry dynamics and shape product strategy and market entry decisions.',
      },
      {
        name: 'Business Model Canvas',
        desc: 'Visualizes a product’s business model, identifying value propositions, customer segments, and revenue streams.',
      },
      {
        name: 'Blue Ocean Strategy',
        desc: 'Focuses on creating new market space and differentiating products, making competition irrelevant.',
      },
      {
        name: 'STM & 4Ps',
        desc: 'Segmentation, targeting, positioning; defines product, price, place, and promotion to effectively reach target customers.',
      },
    ],
  },
  {
    title: 'Product Management Framework',
    items: [
      {
        name: 'Lean Startup Methodology',
        desc: 'Validates product ideas quickly through MVPs, enabling iterative development based on customer feedback.',
      },
      {
        name: 'Design Thinking',
        desc: 'Empathizes with users to ideate and prototype human-centered solutions, enhancing product innovation.',
      },
      {
        name: 'Jobs to be Done (JTBD)',
        desc: 'Understands customer motivations and needs to design products that solve specific problems effectively.',
      },
      {
        name: 'Value Proposition Canvas',
        desc: 'Aligns product features with customer needs, highlighting pains and gains for strategic differentiation.',
      },
    ],
  },
  {
    title: 'Product Development Framework',
    items: [
      {
        name: 'Agile - Scrum',
        desc: 'Certified Scrum Product Owner (CSPO) by Scrum Alliance. Iterative development framework focusing on flexibility, continuous delivery, and collaboration for building products efficiently.',
      },
    ],
  },
];

export default function FrameworkPage() {
  return (
    <Layout>
      {/* Page Title */}
      <div className="page-title mb-8">
        <div className="heading">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col items-center text-center">
              <div className="max-w-2xl">
                <h1 className="text-3xl font-bold mb-2">Framework</h1>
                <p className="text-gray-600 mb-0">
                  A list of business, product management and product development frameworks I have applied in academic coursework and professional work.
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
              <li className="text-foreground font-medium">Framework</li>
            </ol>
          </div>
        </nav>
      </div>

      {/* Services Section */}
      <section id="services" className="services section py-12">
        <div className="max-w-7xl mx-auto px-4">
          {frameworkGroups.map((group) => (
            <div key={group.title} className="mb-8">
              <div className="mb-4">
                <h2 className="text-2xl font-bold">{group.title}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <span>I'm</span>
                  <span className="font-semibold">Familiar with</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.items.map((item) => (
                  <div
                    key={item.name}
                    className="service-item p-6 rounded border border-gray-200 bg-white hover:shadow-md transition-shadow relative"
                  >
                    <div className="icon w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                      ⬡
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{item.name}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </Layout>
  );
}
