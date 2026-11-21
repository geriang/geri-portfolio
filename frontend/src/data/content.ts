// Content replicated from gach.work

export const SITE = {
  title: 'Tech Portfolio',
  name: 'Geri Ang',
  roleLead: 'AI/GenAI Product',
  roles: ['Strategist', 'Manager', 'Owner', 'Builder'],
  note: 'Built and maintained through agentic coding — an AI-driven workflow automating this site\'s development.',
  github: 'https://github.com/geriang',
  linkedin: 'https://www.linkedin.com/in/gerillima/',
};

export const NAV = [
  { href: '/', label: 'Home' },
  { href: '/skill', label: 'Technical Skill' },
  { href: '/framework', label: 'Framework' },
  { href: '/resume', label: 'Resume' },
  { href: '/portfolio', label: 'Portfolio' },
];

export type SkillIcon =
  | 'bootstrap' | 'javascript' | 'react' | 'vue' | 'node' | 'express'
  | 'mysql' | 'mongodb' | 'azure' | 'gcp' | 'python' | 'genai' | 'pyspark'
  | 'github' | 'gitlab' | 'jira' | 'figma' | 'balsamiq' | 'agentic'
  | 'cspos' | 'ml-course' | 'gcp-course' | 'translate';

export interface SkillItem { name: string; icon: SkillIcon; color: string }
export interface SkillGroup { title: string; items: SkillItem[] }
export interface SkillSection { title: string; lead: string; groups: SkillGroup[] }

export const SKILL_SECTIONS: SkillSection[] = [
  {
    title: 'Tech Stack',
    lead: 'Familiar with',
    groups: [
      { title: 'Frontend', items: [
        { name: 'Bootstrap', icon: 'bootstrap', color: '#7e12f9' },
        { name: 'VanillaJS', icon: 'javascript', color: '#f5dd1b' },
        { name: 'ReactJS', icon: 'react', color: '#01d8ff' },
        { name: 'VueJS', icon: 'vue', color: '#3fb984' },
      ] },
      { title: 'Backend', items: [
        { name: 'NodeJS', icon: 'node', color: '#56a643' },
        { name: 'ExpressJS', icon: 'express', color: '#fafafa' },
      ] },
      { title: 'Database', items: [
        { name: 'MySQL', icon: 'mysql', color: '#4479a1' },
        { name: 'MongoDB', icon: 'mongodb', color: '#439934' },
      ] },
      { title: 'Cloud', items: [
        { name: 'Azure', icon: 'azure', color: '#0089d6' },
        { name: 'Google Cloud', icon: 'gcp', color: '#4285f4' },
      ] },
      { title: 'Machine Learning', items: [
        { name: 'Python', icon: 'python', color: '#376fa0' },
        { name: 'GenAI / LLM', icon: 'genai', color: '#10a37f' },
        { name: 'PySpark', icon: 'pyspark', color: '#e25a1c' },
      ] },
    ],
  },
  {
    title: 'Tools',
    lead: 'Familiar with',
    groups: [
      { title: 'Product Development', items: [
        { name: 'Github', icon: 'github', color: '#f6f6f6' },
        { name: 'Gitlab', icon: 'gitlab', color: '#e24329' },
        { name: 'Jira', icon: 'jira', color: '#2684ff' },
        { name: 'Figma', icon: 'figma', color: '#a259ff' },
        { name: 'Balsamiq', icon: 'balsamiq', color: '#cf0a2c' },
        { name: 'Agentic Coding', icon: 'agentic', color: '#00b894' },
      ] },
    ],
  },
  {
    title: 'Certifications & Languages',
    lead: 'Certified & Fluent in',
    groups: [
      { title: 'Certifications', items: [
        { name: 'CSPO', icon: 'cspos', color: '#009fda' },
      ] },
      { title: 'Machine Learning (Kaggle)', items: [
        { name: 'Intro to ML', icon: 'ml-course', color: '#20beff' },
        { name: 'Intermediate ML', icon: 'ml-course', color: '#20beff' },
        { name: 'Feature Engineering', icon: 'ml-course', color: '#20beff' },
        { name: 'Time Series', icon: 'ml-course', color: '#20beff' },
        { name: 'ML Explainability', icon: 'ml-course', color: '#20beff' },
      ] },
      { title: 'Google Cloud', items: [
        { name: 'Cloud Foundations', icon: 'gcp-course', color: '#4285f4' },
        { name: 'AI & ML on GCP', icon: 'gcp-course', color: '#4285f4' },
        { name: 'Launching into ML', icon: 'gcp-course', color: '#4285f4' },
      ] },
      { title: 'Languages', items: [
        { name: 'English', icon: 'translate', color: '#dc3545' },
        { name: 'Mandarin', icon: 'translate', color: '#f39c12' },
        { name: 'Korean (TOPIK 3)', icon: 'translate', color: '#2ecc71' },
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
      { title: 'SWOT Analysis', text: 'Analyzes a business\'s strengths, weaknesses, opportunities, and threats for strategic decision-making and product positioning.' },
      { title: "Porter's 5 forces", text: 'Evaluates competitive forces to understand industry dynamics and shape product strategy and market entry decisions.' },
      { title: 'Business Model Canvas', text: 'Visualizes a product\'s business model, identifying value propositions, customer segments, and revenue streams.' },
      { title: 'Blue Ocean Strategy', text: 'Focuses on creating new market space and differentiating products, making competition irrelevant.' },
      { title: 'STM & 4Ps', text: 'Segmentation, targeting, positioning; defines product, price, place, and promotion to effectively reach target customers.' },
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
      { title: 'Agile - Scrum', text: 'Certified Scrum Product Owner (CSPO) by Scrum Alliance. Iterative development framework focusing on flexibility, continuous delivery, and collaboration for building products efficiently.' },
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
    name: 'Geri Ang',
    text: 'AI product specialist with a background in business, psychology, and technology. Excels at identifying overlooked opportunities in unstructured environments and scaling existing initiatives into high-impact AI products, including a RAG-based application and a global AI community. Combines data-driven, behavioural, and systems-oriented thinking to drive adoption, align stakeholders, and operationalize AI use cases in complex institutional settings.',
  },
  education: [
    { 
      heading: 'Master of Technology in Software Engineering', 
      org: 'National University of Singapore, Singapore', 
      paragraphs: ['•Pursuing advanced software engineering coursework (GPA 4.5/5.0).'] 
    },
    { 
      heading: 'Diploma in Web Application Development', 
      org: 'Trent Global College, Singapore', 
      paragraphs: ['•Gained hands-on experience with the MERN Stack (MongoDB/MySQL, Express, React, Node.js), demonstrating the ability to collaborate effectively with developers and understand full-stack product requirements.'] 
    },
    { 
      heading: 'Master of Business Administration, S3 Asia MBA', 
      org: 'National University of Singapore, Singapore', 
      paragraphs: ['•Led a winning team to first place in the Entrepreneurship and Innovation coursework project, developing a business idea from scratch, conducting market validation, and pitching to investors.'] 
    },
    { 
      heading: 'Master of Business Administration<br />(S3 Asia MBA, Dual Degree with NUS/FU)', 
      org: 'Fudan University, China, Shanghai', 
      paragraphs: [
        '•Applied modelling techniques (decision trees, regression) to predict business outcomes using Excel in the Data Analysis module.',
        '•Investigated work value differences across generations in China, Singapore, and South Korea by collecting and analyzing survey data (N=150) with MANOVA. This research earned the MBA Outstanding Thesis Graduate Thesis Award.',
        '•Runner-up in the Mahindra War Room Competition in Mumbai, India (#2 out of 2214 participating teams).',
        '•Represented Fudan University at the Integrated Leadership Case Competition held at Yale University School of Management.'
      ] 
    },
    { 
      heading: 'Bachelor of Arts (Psychology)', 
      org: 'National University of Singapore, Singapore', 
      paragraphs: [
        '•Expanded my statistical skillset for data analysis using software like SPSS, applying techniques like factorial analysis (ANOVA/MANOVA) and correlation studies.',
        '•Gained hands-on experience designing and conducting psychological experiments in both lab and field settings.',
        '•Learnt and practiced methods for data collection, cleaning, and analysis, including identifying and addressing design and analysis issues.',
        '•Collaborated on group empirical projects in Labs in Interpersonal Relationships & Labs in Clinical Psychology, enhancing my research and data analysis skills.'
      ] 
    },
  ] as ResumeItem[],
  experience: [
    { 
      heading: 'AI Product Owner', 
      period: '2025 Apr - Present', 
      org: 'BANK FOR INTERNATIONAL SETTLEMENTS INNOVATION HUB, Singapore', 
      bullets: [
        'Navigated a highly unstructured landscape to identify high-impact opportunities, co-building a global central banking AI community that increased participation by 70% and aligned fragmented efforts with strategic priorities.',
        'Co-led the development and delivery of AI applications for central banking projects across the Singapore Centre\'s portfolio.',
        'Managed cross-functional stakeholders, including participating central bank partners, external vendors, and internal teams spanning Legal & Risk, Strategy & Operations, and Communications.',
        'Defined technical solutions and requirements to support project scoping, procurement, and implementation.'
      ] 
    },
    { 
      heading: 'Associate AI Engineer', 
      period: '2024 Jun - 2025 Mar', 
      org: 'AI SINGAPORE, Singapore', 
      bullets: [
        'Researched RAG solution architectures and proposed a solution pipeline for a European Automobile MNC.',
        'Developed an end-to-end AI information extraction RAG model for a European Automobile MNC to enhance pricing analyst productivity.',
        'Supported project management activities throughout the model development process, ensuring timely delivery and stakeholder alignment.'
      ] 
    },
    { 
      heading: 'Director, Founding Member of Sales & Auction Department (Corporate Account)', 
      period: '2022 Mar - 2024 Jun', 
      org: 'HUTTONS ASIA PTE LTD, Singapore', 
      bullets: [
        'Pitched and developed accounts with major Local Banks and Financial Institutions.',
        'Developed a web application to streamline address generation, reducing mailshot processes by over 50%.',
        'Developed and implemented a Telegram Bot to replace administrative data entry tasks and improved productivity.',
        'Built an email marketing system and database that achieved an average of 39% open rate and 1% click-through rate.'
      ] 
    },
    { 
      heading: 'Associate Director', 
      period: '2019 Jun - 2022 Mar', 
      org: 'KF PROPERTY NETWORK PTE LTD, Singapore', 
      bullets: [
        'Prospected and served local SMEs and MNCs.',
        'Independently generated approximately $200,000 SGD in gross commission over 2020 & 2021 and was ranked 33 out of 500 associates.'
      ] 
    },
    { 
      heading: 'Product Manager', 
      period: '2017 Jun - 2019 May', 
      org: '3I INC, South Korea, Seoul', 
      bullets: [
        'Witnessed the company\'s strategic pivot to a new target market, resulting in product-market fit and sustained growth.',
        'Actively observed the decision-making process that informed the pivot, gaining insights into identifying market segments aligned with product strengths.',
        'Developed a strong understanding of market adaptation, customer segmentation, and iterative product development through firsthand experience.',
        'Introduced and championed Lean Methodology and Job-To-Be-Done framework, driving a more customer-centric approach within the startup.',
        'Reorganised the product portfolio, spearheaded new product development, conducted market research, and oversaw content creation, including instructional videos and comprehensive user manuals.',
        'Collaborated closely with the CTO and a team of software developers, serving as the vital link between client requirements and technical execution. This collaboration contributed significantly to the evolution and success of our flagship product, YouVR – a SaaS solution designed for real estate agents to create virtual tours – which later transformed into Beamo.'
      ] 
    },
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
