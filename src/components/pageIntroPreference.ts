import { useSyncExternalStore } from 'react';

/**
 * Whether the per-page explanations are shown, and where that choice lives.
 *
 * A reader who already knows the pages should be able to put the text away for good, and get it
 * back without hunting: the switch is in the hamburger menu, next to the other things that change
 * how the app looks.
 *
 * Stored per browser rather than per account, because there are no accounts yet. When sign-in
 * arrives, this is the one place to change: read the user's own setting here and fall back to the
 * stored value for anyone not signed in. Nothing else needs to know.
 *
 * No context and no provider. The menu that writes it and the pages that read it sit in different
 * subtrees, so the change is broadcast on the window instead, and `storage` is listened to as well
 * so a second tab follows along.
 */
const KEY = 'pageIntrosHidden';
const CHANGED = 'pageintros:changed';

/**
 * The choice, when storage would not take it.
 *
 * Null means storage is the truth. It becomes a boolean only after a write has actually failed,
 * and goes back to null the moment one succeeds, so a working browser never consults it and another
 * tab's change is still seen.
 *
 * It exists because the catch block below used to say "a preference that cannot be stored is still
 * worth applying for this session" while nothing applied it: the write threw, the read threw, and
 * pressing "Skjul forklaringene" did nothing at all. That is not a theoretical browser. Safari in
 * private mode reads but refuses to write, and this project's own vitest runner has a localStorage
 * with no methods on it whatsoever.
 */
let sessionChoice: boolean | null = null;

/** Reads fall back to "shown" when storage throws and nothing was chosen this session. */
export const pageIntrosHidden = (): boolean => {
  if (sessionChoice !== null) return sessionChoice;
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

export const setPageIntrosHidden = (hidden: boolean): void => {
  try {
    if (hidden) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
    // Recorded. Storage is the truth again, including whatever another tab writes to it.
    sessionChoice = null;
  } catch {
    sessionChoice = hidden;
  }
  window.dispatchEvent(new Event(CHANGED));
};

const subscribe = (onChange: () => void): (() => void) => {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener('storage', onChange);
  };
};

export const usePageIntrosHidden = (): boolean =>
  useSyncExternalStore(subscribe, pageIntrosHidden, () => false);
