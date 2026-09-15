import { describe, it, expect, beforeEach, vi } from 'vitest';
import { pageIntrosHidden, setPageIntrosHidden } from '../pageIntroPreference';

/**
 * What happens to the choice when the browser will not store it.
 *
 * The module is stateful across tests in one file, on purpose: the session fallback has to survive
 * a re-render to be worth anything. Each case therefore resets it by writing through a storage that
 * works, which is also the thing that proves the fallback gets cleared again.
 */
const working = (): Storage => {
  const entries = new Map<string, string>();
  return {
    getItem: (k: string) => entries.get(k) ?? null,
    setItem: (k: string, v: string) => { entries.set(k, String(v)); },
    removeItem: (k: string) => { entries.delete(k); },
    clear: () => entries.clear(),
    key: (i: number) => [...entries.keys()][i] ?? null,
    get length() { return entries.size; }
  } as Storage;
};

/** No methods at all. This is what vitest's own runner hands the app. */
const missing = () => ({}) as unknown as Storage;

/** Reads fine, refuses to write. Safari in private mode, and a full quota. */
const readOnly = (): Storage => ({
  ...working(),
  setItem: () => { throw new DOMException('QuotaExceededError'); },
  removeItem: () => { throw new DOMException('QuotaExceededError'); },
}) as Storage;

const reset = () => {
  vi.stubGlobal('localStorage', working());
  setPageIntrosHidden(false);
};

describe('pageIntroPreference', () => {
  beforeEach(reset);

  it('stores the choice when the browser allows it', () => {
    setPageIntrosHidden(true);
    expect(pageIntrosHidden()).toBe(true);
    expect(localStorage.getItem('pageIntrosHidden')).toBe('1');
  });

  /**
   * The bug this file was written for. The write threw, the read threw, and the answer was "false"
   * either way, so pressing "Skjul forklaringene" did nothing and the comment in the catch block
   * claimed otherwise.
   */
  it('applies the choice for this session when storage has no methods', () => {
    vi.stubGlobal('localStorage', missing());

    setPageIntrosHidden(true);

    expect(pageIntrosHidden()).toBe(true);
  });

  it('applies it when storage reads but refuses to write', () => {
    vi.stubGlobal('localStorage', readOnly());

    setPageIntrosHidden(true);

    expect(pageIntrosHidden()).toBe(true);
  });

  /** Both ways. A choice you cannot undo is not a choice. */
  it('can be turned off again without storage', () => {
    vi.stubGlobal('localStorage', missing());

    setPageIntrosHidden(true);
    setPageIntrosHidden(false);

    expect(pageIntrosHidden()).toBe(false);
  });

  /**
   * The session value must not outlive its reason. Once a write lands, storage is the truth again,
   * including whatever another tab puts there.
   */
  it('lets storage take over again once a write succeeds', () => {
    vi.stubGlobal('localStorage', missing());
    setPageIntrosHidden(true);

    const store = working();
    vi.stubGlobal('localStorage', store);
    setPageIntrosHidden(false);
    store.setItem('pageIntrosHidden', '1'); // as another tab would

    expect(pageIntrosHidden()).toBe(true);
  });

  it('says shown when storage is unavailable and nothing was chosen', () => {
    vi.stubGlobal('localStorage', missing());

    expect(pageIntrosHidden()).toBe(false);
  });
});
