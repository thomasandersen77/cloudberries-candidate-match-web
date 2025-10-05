// Utility to extract a flat list of skill names from arbitrary CV JSON
export function extractSkills(cv: unknown): string[] {
  const skills: string[] = [];

  const pushValue = (v: unknown) => {
    if (!v) return;
    if (typeof v === 'string') skills.push(v);
    else if (typeof v === 'number') skills.push(String(v));
    else if (Array.isArray(v)) v.forEach(pushValue);
    else if (typeof v === 'object') {
      const o = v as Record<string, unknown>;
      if (typeof o.name === 'string') skills.push(o.name);
      // join fields like label/title if present
      if (typeof o.label === 'string') skills.push(o.label);
      if (typeof o.title === 'string') skills.push(o.title);
    }
  };

  const walk = (obj: unknown) => {
    if (!obj) return;
    if (Array.isArray(obj)) return obj.forEach(walk);
    if (typeof obj !== 'object') return;
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const key = k.toLowerCase();
      if (key.includes('skill') || key.includes('kompetanse') || key.includes('technology')) {
        pushValue(v);
      }
      // dive
      if (v && typeof v === 'object') walk(v);
    }
  };

  if (cv && typeof cv === 'object') walk(cv);

  // normalize and de-duplicate
  const normalized = skills
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\s+/g, ' '));

  const set = new Map<string, number>();
  normalized.forEach((s) => set.set(s, (set.get(s) ?? 0) + 1));

  // sort by frequency desc
  return Array.from(set.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
}
