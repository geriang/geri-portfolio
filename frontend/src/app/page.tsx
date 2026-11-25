import Layout from '@/components/Layout';

export default function Home() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center text-center py-20 px-4">
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-6">
          Geri Ang
        </h1>
        <h2 className="text-2xl md:text-3xl font-medium text-blue-600 dark:text-blue-400 mb-8">
          AI/GenAI Product
        </h2>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-slate-400 leading-relaxed mb-10">
          Built and maintained through agentic coding — an AI-driven workflow automating this site's development.
        </p>
        <div className="flex space-x-4">
          <a 
            href="https://github.com/geriang" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors"
          >
            GitHub
          </a>
          <a 
            href="https://www.linkedin.com/in/gerillima/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="border border-slate-300 dark:border-slate-700 px-6 py-3 rounded-full font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </Layout>
  );
}
