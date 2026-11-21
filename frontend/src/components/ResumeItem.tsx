import { type ResumeEntry } from '@/data/content';

/** A single timeline entry on the resume page. */
export function ResumeItem({ entry }: { entry: ResumeEntry }) {
  return (
    <div className="resume-item">
      <h4>{entry.title}</h4>
      {entry.date ? <h5>{entry.date}</h5> : null}
      {entry.org ? (
        <p>
          <em>{entry.org}</em>
        </p>
      ) : null}
      {entry.points ? (
        <ul>
          {entry.points.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default ResumeItem;
