import { type ServiceItem as ServiceItemData } from '@/data/content';

/** A framework card: accent icon tile + title + description. */
export function ServiceItem({ item }: { item: ServiceItemData }) {
  const mark = item.title.trim().charAt(0).toUpperCase() || '•';
  return (
    <div className="service-item">
      <div className="service-icon" aria-hidden="true">
        {mark}
      </div>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </div>
  );
}

export default ServiceItem;
