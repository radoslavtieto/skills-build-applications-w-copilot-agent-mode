import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type ResourceKey = 'activities' | 'teams' | 'leaderboard' | 'suggestions';
type Props<T> = {
  title: string;
  description: string;
  endpoint: string;
  dataKey: ResourceKey;
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
};

export function CapabilityCard<T>({ title, description, endpoint, dataKey, emptyMessage, renderItem }: Props<T>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    getJson<Partial<Record<ResourceKey, T[]>>>(endpoint)
      .then((response) => {
        const result = response[dataKey];
        if (!Array.isArray(result)) throw new Error(`Invalid ${dataKey} response`);
        if (active) setItems(result);
      })
      .catch(() => {
        if (active) setHasError(true);
      });

    return () => {
      active = false;
    };
  }, [dataKey, endpoint]);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {hasError ? (
          <p role="alert">Unable to load {title.toLowerCase()}. Please try again later.</p>
        ) : items === null ? (
          <p role="status">Loading {title.toLowerCase()}...</p>
        ) : items.length === 0 ? (
          <p>{emptyMessage}</p>
        ) : (
          <ul className="list-group">
            {items.map((item, index) => <li className="list-group-item" key={index}>{renderItem(item)}</li>)}
          </ul>
        )}
      </div>
    </section>
  );
}
