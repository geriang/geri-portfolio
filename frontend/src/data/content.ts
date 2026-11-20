// Generated sample content (fictional person) used to replicate the gach.work layout.

export const SITE = {
  title: 'Tech Portfolio',
  name: 'Alex Morgan',
  roleLead: 'AI/GenAI Product',
  roles: ['Strategist', 'Manager', 'Owner', 'Builder'],
  note: "Built and maintained through agentic coding — an AI-driven workflow automating this site's development.",
  footer:
    'This portfolio showcases sample experience and skills in technology, with a focus on Product Management and Development.',
  github: 'https://github.com/example',
  linkedin: 'https://www.linkedin.com/in/example',
};

export const NAV = [
  { href: '/', label: 'Home' },
  { href: '/skill', label: 'Technical Skill' },
  { href: '/framework', label: 'Framework' },
  { href: '/resume', label: 'Resume' },
  { href: '/portfolio', label: 'Portfolio' },
];

export type SkillIcon =
  | 'code' | 'cpu' | 'database' | 'cloud' | 'bolt' | 'wrench'
  | 'badge' | 'cap' | 'chart' | 'bulb' | 'language' | 'pencil';

export interface SkillItem { name: string; icon: SkillIcon; color: string }
export interface SkillGroup { title: string; items: SkillItem[] }
export interface SkillSection { title: string; lead: string; groups: SkillGroup[] }

export const SKILL_SECTIONS: SkillSection[] = [
  {
    title: 'Tech Stack',
    lead: 'Familiar with',
    groups: [
      { title: 'Frontend', items: [
        { name: 'CSS Framework', icon: 'code', color: '#7e12f9' },
        { name: 'VanillaJS', icon: 'code', color: '#f5dd1b' },
        { name: 'ReactJS', icon: 'code', color: '#01d8ff' },
        { name: 'VueJS', icon: 'code', color: '#3fb984' },
      ] },
      { title: 'Backend', items: [
        { name: 'NodeJS', icon: 'code', color: '#56a643' },
        { name: 'ExpressJS', icon: 'code', color: '#fafafa' },
      ] },
      { title: 'Database', items: [
        { name: 'SQL', icon: 'database', color: '#4479a1' },
        { name: 'NoSQL', icon: 'database', color: '#439934' },
      ] },
      { title: 'Cloud', items: [
        { name: 'Cloud Platform A', icon: 'cloud', color: '#0089d6' },
        { name: 'Cloud Platform B', icon: 'cloud', color: '#4285f4' },
      ] },
      { title: 'Machine Learning', items: [
        { name: 'Python', icon: 'code', color: '#376fa0' },
        { name: 'GenAI / LLM', icon: 'cpu', color: '#10a37f' },
        { name: 'Data Pipelines', icon: 'bolt', color: '#e25a1c' },
      ] },
    ],
  },
  {
    title: 'Tools',
    lead: 'Familiar with',
    groups: [
      { title: 'Product Development', items: [
        { name: 'Version Control', icon: 'code', color: '#f6f6f6' },
        { name: 'CI/CD', icon: 'wrench', color: '#e24329' },
        { name: 'Issue Tracking', icon: 'chart', color: '#2684ff' },
        { name: 'Design Tool', icon: 'pencil', color: '#a259ff' },
        { name: 'Wireframing', icon: 'pencil', color: '#cf0a2c' },
        { name: 'Agentic Coding', icon: 'cpu', color: '#00b894' },
      ] },
    ],
  },
  {
    title: 'Certifications & Languages',
    lead: 'Certified & Fluent in',
    groups: [
      { title: 'Certifications', items: [
        { name: 'Product Owner Cert.', icon: 'badge', color: '#009fda' },
      ] },
      { title: 'Machine Learning Courses', items: [
        { name: 'Intro to ML', icon: 'cap', color: '#20beff' },
        { name: 'Intermediate ML', icon: 'cap', color: '#20beff' },
        { name: 'Feature Engineering', icon: 'wrench', color: '#20beff' },
        { name: 'Time Series', icon: 'chart', color: '#20beff' },
        { name: 'ML Explainability', icon: 'bulb', color: '#20beff' },
      ] },
      { title: 'Languages', items: [
        { name: 'English', icon: 'language', color: '#dc3545' },
        { name: 'Language Two', icon: 'language', color: '#f39c12' },
        { name: 'Language Three', icon: 'language', color: '#2ecc71' },
      ] },
    ],
  },
];

export interface FrameworkItem { title: string; text: string }
export interface FrameworkSection { title: string; items: FrameworkItem[] }

export const FRAMEWORK_SECTIONS: FrameworkSection[] = [
  {
    title: 'Business Framework',
    items: [
      { title: 'SWOT Analysis', text: 'Analyzes strengths, weaknesses, opportunities, and threats for strategic decision-making and product positioning.' },
      { title: "Five Forces", text: 'Evaluates competitive forces to understand industry dynamics and shape market entry decisions.' },
      { title: 'Business Model Canvas', text: 'Visualizes a product’s business model, identifying value propositions, customer segments, and revenue streams.' },
      { title: 'Blue Ocean Strategy', text: 'Focuses on creating new market space and differentiating products, making competition irrelevant.' },
      { title: 'STP & 4Ps', text: 'Segmentation, targeting, positioning; defines product, price, place, and promotion to reach target customers.' },
    ],
  },
  {
    title: 'Product Management Framework',
    items: [
      { title: 'Lean Startup Methodology', text: 'Validates product ideas quickly through MVPs, enabling iterative development based on customer feedback.' },
      { title: 'Design Thinking', text: 'Empathizes with users to ideate and prototype human-centered solutions, enhancing product innovation.' },
      { title: 'Jobs to be Done (JTBD)', text: 'Understands customer motivations and needs to design products that solve specific problems effectively.' },
      { title: 'Value Proposition Canvas', text: 'Aligns product features with customer needs, highlighting pains and gains for strategic differentiation.' },
    ],
  },
  {
    title: 'Product Development Framework',
    items: [
      { title: 'Agile - Scrum', text: 'Iterative development framework focusing on flexibility, continuous delivery, and collaboration for building products efficiently.' },
    ],
  },
];

export interface ResumeItem {
  heading: string;
  period?: string;
  org: string;
  paragraphs?: string[];
  bullets?: string[];
}

export const RESUME = {
  summary: {
    name: SITE.name,
    text: 'Sample summary: AI product specialist with a background in business, psychology, and technology. Identifies opportunities in unstructured environments and scales initiatives into high-impact AI products.',
  },
  education: [
    { heading: 'Master of Technology in Software Engineering', org: 'Example University, Singapore', paragraphs: ['•Pursuing advanced software engineering coursework.'] },
    { heading: 'Diploma in Web Application Development', org: 'Example College, Singapore', paragraphs: ['•Hands-on experience with a full-stack JavaScript stack.'] },
    { heading: 'Master of Business Administration', org: 'Example University, Singapore', paragraphs: ['•Led a team to first place in an entrepreneurship and innovation project.'] },
    { heading: 'Bachelor of Arts (Psychology)', org: 'Example University, Singapore', paragraphs: ['•Statistical analysis and experiment design in lab and field settings.'] },
  ] as ResumeItem[],
  experience: [
    { heading: 'AI Product Owner', period: '2025 Apr - Present', org: 'EXAMPLE INSTITUTE, Singapore', bullets: [
      'Identified high-impact opportunities and co-built an AI community that grew participation.',
      'Co-led delivery of AI applications across a portfolio of projects.',
      'Managed cross-functional stakeholders, vendors, and internal teams.',
    ] },
    { heading: 'Associate AI Engineer', period: '2024 Jun - 2025 Mar', org: 'EXAMPLE AI LAB, Singapore', bullets: [
      'Researched RAG solution architectures and proposed a solution pipeline.',
      'Developed an end-to-end information extraction model to improve analyst productivity.',
    ] },
    { heading: 'Director, Sales & Auction Department', period: '2022 Mar - 2024 Jun', org: 'EXAMPLE REALTY PTE LTD, Singapore', bullets: [
      'Developed key corporate accounts.',
      'Built a web application and a chat bot that automated administrative tasks.',
    ] },
    { heading: 'Product Manager', period: '2017 Jun - 2019 May', org: 'EXAMPLE STARTUP INC, Seoul', bullets: [
      'Championed lean methodology and a customer-centric approach within the startup.',
      'Worked closely with developers to evolve the flagship SaaS product.',
    ] },
  ] as ResumeItem[],
};

export interface Project {
  title: string;
  text: string;
  category: 'app' | 'product';
  href: string;
  hue: number;
}

export const PROJECTS: Project[] = [
  { title: 'Vanilla Javascript Web App', text: 'A mobile responsive web app for searching historical transactions', category: 'app', href: '#', hue: 150 },
  { title: 'Chat Bot', text: 'A bot that extracts and processes information from uploaded receipts', category: 'app', href: '#', hue: 200 },
  { title: 'Immersive Spaces', text: 'A platform for capturing and creating immersive 3D models of physical spaces', category: 'product', href: '#', hue: 260 },
  { title: 'Full Stack Web App', text: 'A mobile responsive bidding website (proof of concept)', category: 'app', href: '#', hue: 30 },
  { title: 'Extraction Web App', text: 'A web application that extracts addresses and outputs a CSV file', category: 'app', href: '#', hue: 330 },
  { title: 'RAG Pipeline Project', text: 'An end-to-end RAG/LLM pipeline', category: 'product', href: '#', hue: 100 },
  { title: 'Listing Management Web App', text: 'A mobile responsive web app that performs CRUD for listings', category: 'app', href: '#', hue: 180 },
  { title: 'Community Programme', text: 'An AI collaboration community supporting knowledge sharing and a flagship hackathon', category: 'product', href: '#', hue: 60 },
];
