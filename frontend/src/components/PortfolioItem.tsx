import { type Project } from '@/data/content';

/** A portfolio card with a coloured thumbnail and a hover overlay. */
export function PortfolioItem({ project }: { project: Project }) {
  return (
    <div className="portfolio-item">
      <div
        className="portfolio-thumb"
        style={{ background: `linear-gradient(135deg, ${project.color}, #000000)` }}
      >
        {project.name}
      </div>
      <div className="portfolio-info">
        <h4>{project.name}</h4>
        <p>{project.description}</p>
        {project.href ? (
          <a
            className="details-link"
            href={project.href}
            target="_blank"
            rel="noreferrer"
            aria-label={`More about ${project.name}`}
          >
            ↗
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default PortfolioItem;
