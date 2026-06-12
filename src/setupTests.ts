import { afterEach, expect } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';

expect.extend(matchers);

// Unmount React trees after each test so repeated render() calls don't leak
// DOM into subsequent tests (avoids "multiple elements found").
afterEach(() => {
  cleanup();
});
