import Layout from '@/components/Layout';

export default function ResumePage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Resume</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-12">
          Relevant Work Experience and Education for an AI Product Manager Role
        </p>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6 border-l-4 border-blue-600 pl-4">Summary</h2>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-bold mb-2">Geri Ang</h3>
              <p className="text-slate-600 dark:text-slate-400 italic leading-relaxed">
                AI product specialist with a background in business, psychology, and technology. Excels at identifying overlooked opportunities in unstructured environments and scaling existing initiatives into high-impact AI products, including a RAG-based application and a global AI community. Combines data-driven, behavioural, and systems-oriented thinking to drive adoption, align stakeholders, and operationalize AI use cases in complex institutional settings.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6 border-l-4 border-blue-600 pl-4">Education</h2>
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold">Master of Technology in Software Engineering</h3>
                </div>
                <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">National University of Singapore, Singapore</p>
                <p className="text-slate-600 dark:text-slate-400">• Pursuing advanced software engineering coursework (GPA 4.5/5.0).</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold">Diploma in Web Application Development</h3>
                </div>
                <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">Trent Global College, Singapore</p>
                <p className="text-slate-600 dark:text-slate-400">• Gained hands-on experience with the MERN Stack (MongoDB/MySQL, Express, React, Node.js), demonstrating the ability to collaborate effectively with developers and understand full-stack product requirements.</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold">Master of Business Administration, S3 Asia MBA</h3>
                </div>
                <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">National University of Singapore, Singapore</p>
                <p className="text-slate-600 dark:text-slate-400">• Led a winning team to first place in the Entrepreneurship and Innovation coursework project, developing a business idea from scratch, conducting market validation, and pitching to investors.</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold">Master of Business Administration (S3 Asia MBA, Dual Degree with NUS/FU)</h3>
                </div>
                <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">Fudan University, China, Shanghai</p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2">
                  <li>Applied modelling techniques (decision trees, regression) to predict business outcomes using Excel in the Data Analysis module.</li>
                  <li>Investigated work value differences across generations in China, Singapore, and South Korea by collecting and analyzing survey data (N=150) with MANOVA. This research earned the MBA Outstanding Thesis Graduate Thesis Award.</li>
                  <li>Runner-up in the Mahindra War Room Competition in Mumbai, India (#2 out of 2214 participating teams).</li>
                  <li>Represented Fudan University at the Integrated Leadership Case Competition held at Yale University School of Management.</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold">Bachelor of Arts (Psychology)</h3>
                </div>
                <p className="text-blue-600 dark:text-blue-400 font-medium mb-2">National University of Singapore, Singapore</p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2">
                  <li>Expanded my statistical skillset for data analysis using software like SPSS, applying techniques like factorial analysis (ANOVA/MANOVA) and correlation studies.</li>
                  <li>Gained hands-on experience designing and conducting psychological experiments in both lab and field settings.</li>
                  <li>Learnt and practiced methods for data collection, cleaning, and analysis, including identifying and addressing design and analysis issues.</li>
                  <li>Collaborated on group empirical projects in Labs in Interpersonal Relationships & Labs in Clinical Psychology, enhancing my research and data analysis skills.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6 border-l-4 border-blue-600 pl-4">Professional Experience</h2>
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold">AI Product Owner</h3>
                  <span className="text-sm text-slate-500 dark:text-slate-400">2025 Apr - Present</span>
                </div>
                <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">BANK FOR INTERNATIONAL SETTLEMENTS INNOVATION HUB, Singapore</p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2">
                  <li>Navigated a highly unstructured landscape to identify high-impact opportunities, co-building a global central banking AI community that increased participation by 70% and aligned fragmented efforts with strategic priorities.</li>
                  <li>Co-led the development and delivery of AI applications for central banking projects across the Singapore Centre's portfolio.</li>
                  <li>Managed cross-functional stakeholders, including participating central bank partners, external vendors, and internal teams spanning Legal & Risk, Strategy & Operations, and Communications.</li>
                  <li>Defined technical solutions and requirements to support project scoping, procurement, and implementation.</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold">Associate AI Engineer</h3>
                  <span className="text-sm text-slate-500 dark:text-slate-400">2024 Jun - 2025 Mar</span>
                </div>
                <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">AI SINGAPORE, Singapore</p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2">
                  <li>Researched RAG solution architectures and proposed a solution pipeline for a European Automobile MNC.</li>
                  <li>Developed an end-to-end AI information extraction RAG model for a European Automobile MNC to enhance pricing analyst productivity.</li>
                  <li>Supported project management activities throughout the model development process, ensuring timely delivery and stakeholder alignment.</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold">Director, Founding Member of Sales & Auction Department (Corporate Account)</h3>
                  <span className="text-sm text-slate-500 dark:text-slate-400">2022 Mar - 2024 Jun</span>
                </div>
                <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">HUTTONS ASIA PTE LTD, Singapore</p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2">
                  <li>Pitched and developed accounts with major Local Banks and Financial Institutions.</li>
                  <li>Developed a web application to streamline address generation, reducing mailshot processes by over 50%.</li>
                  <li>Developed and implemented a Telegram Bot to replace administrative data entry tasks and improved productivity.</li>
                  <li>Built an email marketing system and database that achieved an average of 39% open rate and 1% click-through rate.</li>
                </ul>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold">Associate Director</h3>
                  <span className="text-sm text-slate-500 dark:text-slate-400">2019 Jun - 2022 Mar</span>
                </div>
                <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">KF PROPERTY NETWORK PTE LTD, Singapore</p>
                <p className="text-slate-600 dark:text-slate-400">• Prospected and served local SMEs and MNCs.</p>
                <p className="text-slate-600 dark:text-slate-400">• Independently generated approximately $200,000 SGD in gross commission over 2020 & 2021 and was ranked 33 out of 500 associates.</p>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold">Product Manager</h3>
                  <span className="text-sm text-slate-500 dark:text-slate-400">2017 Jun - 2019 May</span>
                </div>
                <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">3I INC, South Korea, Seoul</p>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-2">
                  <li>Witnessed the company’s strategic pivot to a new target market, resulting in product-market fit and sustained growth.</li>
                  <li>Actively observed the decision-making process that informed the pivot, gaining insights into identifying market segments aligned with product strengths.</li>
                  <li>Developed a strong understanding of market adaptation, customer segmentation, and iterative product development through firsthand experience.</li>
                  <li>Introduced and championed Lean Methodology and Job-To-Be-Done framework, driving a more customer-centric approach within the startup.</li>
                  <li>Reorganised the product portfolio, spearheaded new product development, conducted market research, and oversaw content creation, including instructional videos and comprehensive user manuals.</li>
                  <li>Collaborated closely with the CTO and a team of software developers, serving as the vital link between client requirements and technical execution. This collaboration contributed significantly to the evolution and success of our flagship product, YouVR – a SaaS solution designed for real estate agents to create virtual tours – which later transformed into Beamo.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
