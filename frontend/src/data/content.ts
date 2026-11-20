// Generated sample content (fictional person) used to replicate the gach.work layout.

export const SITE = {
  title: 'Tech Portfolio',
  name: 'Alex Morgan',
  roleLead: 'Data & Product',
  roles: ['Explorer', 'Designer', 'Maker', 'Mentor'],
  note: 'Sample portfolio generated for demonstration purposes.',
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
        { name: 'Sample Certificate', icon: 'badge', color: '#009fda' },
      ] },
      { title: 'Courses', items: [
        { name: 'Statistics Basics', icon: 'cap', color: '#20beff' },
        { name: 'Data Visualisation', icon: 'chart', color: '#20beff' },
        { name: 'Prompt Design', icon: 'bulb', color: '#20beff' },
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
    text: 'Fictional sample profile. A generalist who enjoys turning rough ideas into small, useful tools, and who is comfortable working between design, engineering and operations.',
  },
  education: [
    { heading: 'MSc in Computer Science', org: 'Northfield University, Sample City', paragraphs: ['•Sample coursework in algorithms and distributed systems.'] },
    { heading: 'Certificate in Interaction Design', org: 'Harbour Institute, Sample City', paragraphs: ['•Sample studio projects on prototyping and usability testing.'] },
    { heading: 'BSc in Applied Mathematics', org: 'Westbrook College, Sample City', paragraphs: ['•Sample thesis on optimisation methods.'] },
  ] as ResumeItem[],
  experience: [
    { heading: 'Senior Product Analyst', period: '2023 Jan - Present', org: 'ACME ANALYTICS LTD, Sample City', bullets: [
      'Sample bullet: led a small team shipping a dashboard used by internal staff.',
      'Sample bullet: wrote requirements and coordinated with engineering and design.',
    ] },
    { heading: 'Software Developer', period: '2020 Feb - 2022 Dec', org: 'BRIGHTLINE SOFTWARE, Sample City', bullets: [
      'Sample bullet: built and maintained web services and internal tooling.',
      'Sample bullet: introduced automated checks to the release process.',
    ] },
    { heading: 'Operations Associate', period: '2018 Aug - 2020 Jan', org: 'CEDAR LOGISTICS, Sample City', bullets: [
      'Sample bullet: documented processes and reduced manual reporting work.',
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
  { title: 'Weather Dashboard', text: 'A responsive dashboard showing sample forecast data', category: 'app', href: '#', hue: 150 },
  { title: 'Expense Tracker', text: 'A small app for logging and summarising sample expenses', category: 'app', href: '#', hue: 200 },
  { title: 'Onboarding Redesign', text: 'A sample case study on simplifying a sign-up flow', category: 'product', href: '#', hue: 260 },
  { title: 'Recipe Finder', text: 'A search interface over a sample recipe collection', category: 'app', href: '#', hue: 30 },
  { title: 'Habit Planner', text: 'A planner with streaks and reminders (prototype)', category: 'app', href: '#', hue: 330 },
  { title: 'Roadmap Workshop', text: 'A sample write-up of a prioritisation workshop', category: 'product', href: '#', hue: 100 },
  { title: 'Inventory Manager', text: 'A CRUD app for managing sample stock items', category: 'app', href: '#', hue: 180 },
  { title: 'Community Meetup', text: 'A sample programme plan for a recurring community event', category: 'product', href: '#', hue: 60 },
];
