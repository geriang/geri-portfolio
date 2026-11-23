import type { IconName } from '@/components/Icon';

/**
 * Site content for the gach.work replica.
 *
 * All copy here is GENERATED PLACEHOLDER DATA for a fictional persona.
 * It deliberately contains no real names, contact details, employers,
 * institutions or photographs — replace it with real content before launch.
 */

export interface NavItem {
  href: string;
  label: string;
}

export interface SocialLink {
  icon: IconName;
  href: string;
  label: string;
}

export interface FeatureItem {
  icon: IconName;
  color: string;
  name: string;
}

export interface FeatureGroup {
  label: string;
  items: FeatureItem[];
}

export interface CardGroup {
  title: string;
  emphasis: string;
  groups: FeatureGroup[];
}

export interface ServiceItem {
  icon: IconName;
  title: string;
  description: string;
}

export interface ServiceGroup {
  title: string;
  emphasis: string;
  items: ServiceItem[];
}

export interface ResumeEntry {
  title: string;
  period?: string;
  org?: string;
  summary?: string;
  bullets?: string[];
}

export interface ResumeGroup {
  title: string;
  entries: ResumeEntry[];
}

export interface PortfolioFilter {
  key: string;
  label: string;
}

export interface PortfolioItem {
  filter: string;
  title: string;
  description: string;
  href: string;
  gradient: [string, string];
}

export const site = {
  sitename: 'Tech Portfolio',
  title: 'Personal Portfolio',
  year: '2026',
  footerTagline:
    'This portfolio showcases my experience and skills in technology, with a particular focus on my expertise and interest in Product Management and Development.',
  hero: {
    name: 'Jordan Lee',
    role: 'AI/GenAI Product',
    typedItems: ['Strategist', 'Manager', 'Owner', 'Builder'],
    note: 'Built and maintained through agentic coding — an AI-driven workflow automating this site\u2019s development.',
  },
  social: {
    hero: [
      {
        icon: 'linkedin',
        href: 'https://www.linkedin.com/',
        label: 'LinkedIn',
      },
      {
        icon: 'github',
        href: 'https://github.com/',
        label: 'GitHub',
      },
    ] satisfies SocialLink[],
    footer: [
      {
        icon: 'github',
        href: 'https://github.com/',
        label: 'GitHub',
      },
      {
        icon: 'linkedin',
        href: 'https://www.linkedin.com/',
        label: 'LinkedIn',
      },
    ] satisfies SocialLink[],
  },
};

export const navItems: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/skill', label: 'Technical Skill' },
  { href: '/framework', label: 'Framework' },
  { href: '/resume', label: 'Resume' },
  { href: '/portfolio', label: 'Portfolio' },
];

/* Technical Skill ------------------------------------------------------------ */

export const skillPage = {
  heading: 'Technical Skill',
  intro:
    'A list of technical skills and tools I have applied in personal projects, academic coursework, and professional work.',
  groups: [
    {
      title: 'Tech Stack',
      emphasis: 'Familiar with',
      groups: [
        {
          label: 'Frontend',
          items: [
            { icon: 'bootstrap', color: '#7e12f9', name: 'Bootstrap' },
            { icon: 'filetype-js', color: '#f5dd1b', name: 'VanillaJS' },
            { icon: 'filetype-jsx', color: '#01d8ff', name: 'ReactJS' },
            { icon: 'filetype-tsx', color: '#3fb984', name: 'TypeScript' },
          ],
        },
        {
          label: 'Styling',
          items: [
            { icon: 'filetype-css', color: '#2aa4e8', name: 'Tailwind CSS' },
            { icon: 'filetype-scss', color: '#cf649a', name: 'SCSS' },
          ],
        },
        {
          label: 'Backend',
          items: [
            { icon: 'terminal', color: '#8dc150', name: 'Node.js' },
            { icon: 'database', color: '#f2682c', name: 'PostgreSQL' },
          ],
        },
        {
          label: 'AI & Data',
          items: [
            { icon: 'cpu', color: '#18d26e', name: 'RAG Pipelines' },
            { icon: 'filetype-py', color: '#4b8bbe', name: 'Python' },
          ],
        },
        {
          label: 'Tooling',
          items: [
            { icon: 'git', color: '#e8744a', name: 'Git' },
            { icon: 'hdd-stack', color: '#2496ed', name: 'Docker' },
            { icon: 'code-slash', color: '#fafafa', name: 'VS Code' },
          ],
        },
      ],
    },
    {
      title: 'Tools',
      emphasis: 'Productive with',
      groups: [
        {
          label: 'Delivery',
          items: [
            { icon: 'window', color: '#fafafa', name: 'Jira' },
            { icon: 'clipboard-data', color: '#5aa9e6', name: 'Confluence' },
            { icon: 'lightning', color: '#ffb400', name: 'Zapier' },
            { icon: 'gear', color: '#9aa0a6', name: 'GitHub Actions' },
            { icon: 'patch-check', color: '#18d26e', name: 'Sentry' },
            { icon: 'cloud', color: '#66c0f4', name: 'AWS' },
          ],
        },
      ],
    },
    {
      title: 'Certifications & Languages',
      emphasis: 'Accredited in',
      groups: [
        {
          label: 'Certifications',
          items: [{ icon: 'award', color: '#e6b800', name: 'CSPO' }],
        },
        {
          label: 'Spoken Languages',
          items: [
            { icon: 'geo-alt', color: '#e05252', name: 'English' },
            { icon: 'mic', color: '#e05252', name: 'Mandarin' },
            { icon: 'translate', color: '#e05252', name: 'Bahasa' },
          ],
        },
        {
          label: 'Written Languages',
          items: [
            { icon: 'chat', color: '#5aa9e6', name: 'English' },
            { icon: 'chat', color: '#5aa9e6', name: 'Mandarin' },
            { icon: 'chat', color: '#5aa9e6', name: 'Japanese' },
          ],
        },
        {
          label: 'Interests',
          items: [
            { icon: 'controller', color: '#a97bff', name: 'Game Dev' },
            { icon: 'joystick', color: '#a97bff', name: 'Retro Gaming' },
          ],
        },
      ],
    },
  ] satisfies CardGroup[],
};

/* Framework ------------------------------------------------------------------ */

export const frameworkPage = {
  heading: 'Framework',
  intro:
    'Business, product and delivery frameworks I have used to structure problems, align stakeholders and ship outcomes.',
  groups: [
    {
      title: 'Business Framework',
      emphasis: 'Familiar with',
      items: [
        {
          icon: 'activity',
          title: 'SWOT Analysis',
          description:
            'Analyzes a business\u2019s strengths, weaknesses, opportunities, and threats for strategic decision-making and product positioning.',
        },
        {
          icon: 'broadcast',
          title: 'Porter\u2019s 5 Forces',
          description:
            'Evaluates competitive forces to understand industry dynamics and shape product strategy and market entry decisions.',
        },
        {
          icon: 'easel',
          title: 'Business Model Canvas',
          description:
            'Maps the nine building blocks of a venture so value proposition, revenue and cost structure stay visible in one page.',
        },
        {
          icon: 'compass',
          title: 'PESTLE',
          description:
            'Surfaces political, economic, social, technological, legal and environmental factors that constrain a market entry plan.',
        },
        {
          icon: 'pie-chart',
          title: 'BCG Matrix',
          description:
            'Prioritises a product portfolio by growth and share, guiding where to invest, harvest or divest effort and budget.',
        },
      ],
    },
    {
      title: 'Product Management Framework',
      emphasis: 'Applied in practice',
      items: [
        {
          icon: 'clipboard-data',
          title: 'RICE Scoring',
          description:
            'Ranks candidate initiatives by reach, impact, confidence and effort to keep a roadmap defensible under limited capacity.',
        },
        {
          icon: 'search',
          title: 'Double Diamond',
          description:
            'Separates problem and solution space into discover, define, develop and deliver phases to reduce premature commitment.',
        },
        {
          icon: 'bullseye',
          title: 'Jobs To Be Done',
          description:
            'Frames requests around the progress a user is trying to make, revealing underserved moments worth building for.',
        },
        {
          icon: 'share',
          title: 'North Star Metric',
          description:
            'Aligns teams on the single metric that captures delivered value, with input metrics that make it actionable.',
        },
      ],
    },
    {
      title: 'Product Development Framework',
      emphasis: 'Used to deliver',
      items: [
        {
          icon: 'funnel',
          title: 'Lean Canvas MVP',
          description:
            'Compresses a hypothesis, risk and metric plan onto one page so an MVP can be validated within a single sprint.',
        },
      ],
    },
  ] satisfies ServiceGroup[],
};

/* Resume --------------------------------------------------------------------- */

export const resumePage = {
  heading: 'Resume',
  intro:
    'A summary of my background, education and professional experience across product, analytics and software delivery.',
  left: [
    {
      title: 'Summary',
      entries: [
        {
          title: 'Jordan Lee',
          summary:
            'AI product specialist with a background in business, behavioural science and software delivery. Works best in unstructured environments where the opportunity has not been named yet, and turns scattered initiatives into repeatable products. Combines data-driven, behavioural and systems thinking to drive adoption and align stakeholders.',
        },
      ],
    },
    {
      title: 'Education',
      entries: [
        {
          title: 'M.Sc. Software Engineering',
          org: 'Northgate Institute of Technology, Singapore',
          bullets: [
            'Coursework distributed systems, machine learning and software architecture.',
          ],
        },
        {
          title: 'Diploma Web Application Development',
          org: 'Cobalt Technical College, Singapore',
          bullets: [
            'Full-stack project work across MongoDB, Express, React and Node.js.',
          ],
        },
        {
          title: 'B.Sc. Psychology',
          org: 'Ridley University, Singapore',
          bullets: [
            'Experimental design and applied statistics including ANOVA and regression.',
          ],
        },
      ],
    },
  ] satisfies ResumeGroup[],
  right: [
    {
      title: 'Professional Experience',
      entries: [
        {
          title: 'AI Product Owner',
          period: '2025 Feb \u2013 Present',
          org: 'Helio Systems, Singapore',
          bullets: [
            'Found and consolidated a community of practice for applied AI across internal teams, growing active participation by 70%.',
            'Co-led delivery of two retrieval-augmented generation applications used by internal analysts.',
            'Aligned legal, risk, operations and communications stakeholders around a shared delivery roadmap.',
          ],
        },
        {
          title: 'Associate AI Engineer',
          period: '2023 Jun \u2013 2025 Jan',
          org: 'Meridian Analytics, Singapore',
          bullets: [
            'Built evaluation tooling that cut document review time by 40%.',
            'Owned prompt, retrieval and evaluation iterations for a customer-facing assistant.',
            'Partnered with platform engineers on deployment, monitoring and cost budgets.',
          ],
        },
        {
          title: 'Product Analyst',
          period: '2021 Aug \u2013 2023 May',
          org: 'Larkspur Digital, Singapore',
          bullets: [
            'Instrumented funnels and ran experiments that lifted activation by 12%.',
            'Translated support and research signal into prioritised backlog items.',
          ],
        },
      ],
    },
  ] satisfies ResumeGroup[],
};

/* Portfolio ------------------------------------------------------------------ */

export const portfolioPage = {
  heading: 'Portfolio',
  intro:
    'A selection of projects I have developed and managed across industries, covering AI solutions, web applications and process automation.',
  filters: [
    { key: '*', label: 'All' },
    { key: 'application', label: 'Application' },
    { key: 'management', label: 'Management' },
  ] satisfies PortfolioFilter[],
  items: [
    {
      filter: 'application',
      title: 'Transit Search Web App',
      description:
        'A mobile responsive web app that lets users search historical public transit transactions',
      href: 'https://example.com/transit-search',
      gradient: ['#12241b', '#1f6b45'],
    },
    {
      filter: 'application',
      title: 'Receipt Bot',
      description:
        'A messaging bot that acts as a bookkeeping assistant, extracting figures from uploaded receipts',
      href: 'https://example.com/receipt-bot',
      gradient: ['#12212e', '#215d80'],
    },
    {
      filter: 'management',
      title: 'Spatial Capture Platform',
      description:
        'A platform for capturing and publishing immersive 3D models of physical spaces',
      href: 'https://example.com/spatial-capture',
      gradient: ['#1e1629', '#4b3a73'],
    },
    {
      filter: 'application',
      title: 'Evaluation Workbench',
      description:
        'An internal workbench for scoring retrieval quality across model and prompt variants',
      href: 'https://example.com/evaluation-workbench',
      gradient: ['#2a2114', '#7a5c1f'],
    },
    {
      filter: 'management',
      title: 'Community Program',
      description:
        'A practitioner community program covering onboarding, governance and knowledge sharing',
      href: 'https://example.com/community-program',
      gradient: ['#2a151b', '#7a2f42'],
    },
    {
      filter: 'management',
      title: 'Automation Rollout',
      description:
        'A staged rollout of document processing automation across three operations teams',
      href: 'https://example.com/automation-rollout',
      gradient: ['#122a2e', '#1f6370'],
    },
  ] satisfies PortfolioItem[],
};
