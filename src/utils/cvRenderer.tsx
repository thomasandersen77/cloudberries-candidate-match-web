import React from 'react';

// Heuristic renderer to turn arbitrary CV JSON into sensible sections/paragraphs
export function renderCvToJsx(cv: unknown): React.ReactNode {
  if (cv == null) return <p>Ingen CV-data.</p>;

  if (typeof cv === 'string' || typeof cv === 'number' || typeof cv === 'boolean') {
    return <p>{String(cv)}</p>;
  }

  if (Array.isArray(cv)) {
    return (
      <div>
        {cv.map((item, idx) => (
          <div key={idx} style={{ marginBottom: 12 }}>{renderCvToJsx(item)}</div>
        ))}
      </div>
    );
  }

  if (typeof cv === 'object') {
    const entries = Object.entries(cv as Record<string, unknown>);
    return (
      <div>
        {entries.map(([key, value]) => (
          <section key={key} style={{ marginBottom: 16 }}>
            <h3 style={{ margin: '8px 0' }}>{beautifyKey(key)}</h3>
            <div>{renderCvToJsx(value)}</div>
          </section>
        ))}
      </div>
    );
  }

  return <pre>{JSON.stringify(cv, null, 2)}</pre>;
}

function beautifyKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^\w/, (c) => c.toUpperCase());
}