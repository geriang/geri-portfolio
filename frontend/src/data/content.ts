/**
 * Generated, anonymized content used to replicate the gach.work layout.
 *
 * Per the repository rules, NO real personal data is used: names, employers,
 * links and achievements below are fictional placeholders that mirror the
 * structure of the live site (hero, skill grid, framework grid, resume
 * timeline, portfolio grid).
 */

export interface NavItem {
  href: string;
  label: string;
}

export interface SocialLink {
  label: string;
  href: string;
  icon: 'github' | 'linkedin';
}

export interface SkillItem {
  name: string;
  color: string;
}

export interface SkillGroup {
  title: string;
  items: SkillItem[];
}

export interface SkillSection {
  title: string;
  lead: string;
  groups: SkillGroup[];
}

export interface ServiceItem {
  title: string;
  description: string;
}

export interface ServiceSection {
  title: string;
  lead: string;
  items: ServiceItem[];
}

export interface ResumeEntry {
  title: string;
  date?: string;
  org?: string;
  points?: string[];
}

export interface ResumeColumn {
  heading: string;
  entries: ResumeEntry[];
}

export interface PortfolioCategory {
  id: string;
  label: string;
}

export interface Project {
  name: string;
  description: string;
  category: 'app' | 'product';
  href?: string;
  color: string;
}

/* -------------------------------------------------------------------------- */
/* Site                                                                        */
/* -------------------------------------------------------------------------- */

export const SITE = {
  title: 'Tech Portfolio',
  name: 'Alex Rivera',
  roleLead: 'AI / GenAI Product',
  roles: ['Strategist', 'Manager', 'Owner', 'Builder'],
  note: "Built and maintained through agentic coding — an AI-driven workflow automating this site's development.",
};

export const NAV: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/skill', label: 'Technical Skill' },
  { href: '/framework', label: 'Framework' },
  { href: '/resume', label: 'Resume' },
  { href: '/portfolio', label: 'Portfolio' },
];

export const SOCIALS: SocialLink[] = [
  { label: 'GitHub', href: 'https://github.com/example', icon: 'github' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/example', icon: 'linkedin' },
];

/* -------------------------------------------------------------------------- */
/* Skill page — three sections of grouped interest cards                      */
/* -------------------------------------------------------------------------- */

export const SKILL_SECTIONS: SkillSection[] = [
  {
    title: 'Tech Stack',
    lead: 'Familiar with',
    groups: [
      {
        title: 'Frontend',
        items: [
          { name: 'CSS Framework', color: '#7e12f9' },
          { name: 'VanillaJS', color: '#f5dd1b' },
          { name: 'ReactJS', color: '#01d8ff' },
          { name: 'VueJS', color: '#3fb984' },
        ],
      },
      {
        title: 'Backend',
        items: [
          { name: 'NodeJS', color: '#56a643' },
          { name: 'ExpressJS', color: '#fafafa' },
        ],
      },
      {
        title: 'Database',
        items: [
          { name: 'SQL', color: '#4479a1' },
          { name: 'NoSQL', color: '#439934' },
        ],
      },
      {
        title: 'Cloud',
        items: [
          { name: 'Cloud Platform A', color: '#0089d6' },
          { name: 'Cloud Platform B', color: '#4285f4' },
        ],
      },
      {
        title: 'Machine Learning',
        items: [
          { name: 'Python', color: '#376fa0' },
          { name: 'GenAI / LLM', color: '#10a37f' },
          { name: 'Data Pipelines', color: '#e25a1c' },
        ],
      },
    ],
  },
  {
    title: 'Tools',
    lead: 'Familiar with',
    groups: [
      {
        title: 'Product Development',
        items: [
          { name: 'GitHub', color: '#f6f6f6' },
          { name: 'GitLab', color: '#e24329' },
          { name: 'Jira', color: '#2684ff' },
          { name: 'Figma', color: '#a259ff' },
          { name: 'Balsamiq', color: '#cf0a2c' },
          { name: 'Agentic Coding', color: '#00b894' },
        ],
      },
    ],
  },
  {
    title: 'Certifications & Languages',
    lead: 'Certified & Fluent in',
    groups: [
      {
        title: 'Certifications',
        items: [{ name: 'Product Owner', color: '#009fda' }],
      },
      {
        title: 'Machine Learning',
        items: [
          { name: 'Intro to ML', color: '#20beff' },
          { name: 'Intermediate ML', color: '#20beff' },
          { name: 'Feature Engineering', color: '#20beff' },
          { name: 'Time Series', color: '#20beff' },
          { name: 'ML Explainability', color: '#20beff' },
        ],
      },
      {
        title: 'Cloud',
        items: [
          { name: 'Cloud Foundations', color: '#4285f4' },
          { name: 'AI & ML', color: '#4285f4' },
          { name: 'Launching into ML', color: '#4285f4' },
        ],
      },
      {
        title: 'Languages',
        items: [
          { name: 'English', color: '#dc3545' },
          { name: 'Mandarin', color: '#f39c12' },
          { name: 'Korean', color: '#2ecc71' },
        ],
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Framework page — three sections of service cards                           */
/* -------------------------------------------------------------------------- */

export const FRAMEWORK_SECTIONS: ServiceSection[] = [
  {
    title: 'Business Framework',
    lead: 'Familiar with',
    items: [
      {
        title: 'SWOT Analysis',
        description:
          'Analyzes strengths, weaknesses, opportunities, and threats for strategic decision-making and product positioning.',
      },
      {
        title: "Porter's 5 Forces",
        description:
          'Evaluates competitive forces to understand industry dynamics and shape product strategy and market entry decisions.',
      },
      {
        title: 'Business Model Canvas',
        description:
          'Visualizes a product’s business model, identifying value propositions, customer segments, and revenue streams.',
      },
      {
        title: 'Blue Ocean Strategy',
        description:
          'Focuses on creating new market space and differentiating products, making competition irrelevant.',
      },
      {
        title: 'STM & 4Ps',
        description:
          'Segmentation, targeting, positioning; defines product, price, place, and promotion to reach target customers.',
      },
    ],
  },
  {
    title: 'Product Management Framework',
    lead: 'Familiar with',
    items: [
      {
        title: 'Lean Startup Methodology',
        description:
          'Validates product ideas quickly through MVPs, enabling iterative development based on customer feedback.',
      },
      {
        title: 'Design Thinking',
        description:
          'Empathizes with users to ideate and prototype human-centered solutions, enhancing product innovation.',
      },
      {
        title: 'Jobs to be Done (JTBD)',
        description:
          'Understands customer motivations and needs to design products that solve specific problems effectively.',
      },
      {
        title: 'Value Proposition Canvas',
        description:
          'Aligns product features with customer needs, highlighting pains and gains for strategic differentiation.',
      },
    ],
  },
  {
    title: 'Product Development Framework',
    lead: 'Familiar with',
    items: [
      {
        title: 'Agile — Scrum',
        description:
          'An iterative development framework focusing on flexibility, continuous delivery, and collaboration for building products efficiently.',
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Resume page — two columns: Summary/Education and Professional Experience    */
/* -------------------------------------------------------------------------- */

export const RESUME: ResumeColumn[] = [
  {
    heading: 'Summary',
    entries: [
      {
        title: 'AI Product Specialist',
        points: [
          'Background spanning business, psychology, and technology.',
          'Identifies overlooked opportunities in unstructured environments and scales initiatives into high-impact AI products, including a RAG-based application and a global AI community.',
          'Combines data-driven, behavioural, and systems-oriented thinking to drive adoption and align stakeholders.',
        ],
      },
    ],
  },
  {
    heading: 'Education',
    entries: [
      {
        title: 'Master of Technology in Software Engineering',
        org: 'State University of Singapore',
        points: ['Pursuing advanced software engineering coursework.'],
      },
      {
        title: 'Diploma in Web Application Development',
        org: 'Polytechnic Institute, Singapore',
        points: ['Hands-on experience with the MERN stack, collaborating with developers on full-stack requirements.'],
      },
      {
        title: 'Master of Business Administration',
        org: 'State University of Singapore',
        points: ['Led a team to first place in an entrepreneurship and innovation coursework project.'],
      },
      {
        title: 'Bachelor of Arts (Psychology)',
        org: 'State University of Singapore',
        points: ['Built statistical and experimental research skills (ANOVA/MANOVA, correlation studies).'],
      },
    ],
  },
  {
    heading: 'Professional Experience',
    entries: [
      {
        title: 'AI Product Owner',
        date: '2025 — Present',
        org: 'Innovation Hub, Singapore',
        points: [
          'Identified high-impact opportunities in an unstructured landscape, co-building a global AI community that increased participation by 70%.',
          'Co-led development and delivery of AI applications across a portfolio of projects.',
          'Managed cross-functional stakeholders spanning Legal & Risk, Strategy & Operations, and Communications.',
        ],
      },
      {
        title: 'Associate AI Engineer',
        date: '2024 — 2025',
        org: 'AI Consulting Firm, Singapore',
        points: [
          'Researched RAG solution architectures and proposed a pipeline for a client.',
          'Developed an end-to-end AI information-extraction model to enhance analyst productivity.',
        ],
      },
      {
        title: 'Product Manager',
        date: '2017 — 2019',
        org: 'Startup, Seoul, South Korea',
        points: [
          'Introduced Lean Methodology and the Jobs-to-Be-Done framework, driving a customer-centric approach.',
          'Reorganised the product portfolio and championed new product development and content creation.',
        ],
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Portfolio page — filterable grid of project cards                          */
/* -------------------------------------------------------------------------- */

export const PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  { id: '*', label: 'All' },
  { id: 'app', label: 'Application' },
  { id: 'product', label: 'Management' },
];

export const PROJECTS: Project[] = [
  {
    name: 'Web App',
    description: 'A mobile responsive web app that lets users search past transactions.',
    category: 'app',
    href: 'https://example.com',
    color: '#18d26e',
  },
  {
    name: 'Automation Bot',
    description: 'A bot that extracts and processes information from uploaded documents.',
    category: 'app',
    href: 'https://example.com',
    color: '#01d8ff',
  },
  {
    name: '3D Space Capture',
    description: 'A platform for capturing and creating immersive 3D models of physical spaces.',
    category: 'product',
    color: '#7e12f9',
  },
  {
    name: 'Full Stack Web App',
    description: 'A mobile responsive bidding website (proof of concept).',
    category: 'app',
    href: 'https://example.com',
    color: '#f39c12',
  },
  {
    name: 'Address Extraction',
    description: 'A web application that extracts street addresses and outputs a CSV file.',
    category: 'app',
    href: 'https://example.com',
    color: '#0089d6',
  },
  {
    name: 'RAG / LLM Pipeline',
    description: 'An end-to-end retrieval-augmented-generation and LLM pipeline.',
    category: 'product',
    color: '#e25a1c',
  },
  {
    name: 'Property Listing App',
    description: 'A mobile responsive web app that performs CRUD for property listings.',
    category: 'app',
    href: 'https://example.com',
    color: '#439934',
  },
  {
    name: 'Collaboration Community',
    description: 'An AI collaboration community supporting knowledge sharing and a flagship hackathon.',
    category: 'product',
    color: '#4285f4',
  },
  {
    name: 'Risk Monitoring Twin',
    description: 'A digital twin for financial-stability risk monitoring via cloud ETL pipelines.',
    category: 'product',
    color: '#2ecc71',
  },
  {
    name: 'Fraud Pattern Sharing',
    description: 'A proof-of-concept for cross-border sharing of fraud patterns from payment analytics.',
    category: 'product',
    color: '#a259ff',
  },
];
