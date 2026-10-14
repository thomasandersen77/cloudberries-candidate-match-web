import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { askAssistant, clearConversation, searchChat } from './chatService';

vi.mock('./apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  aiScoringClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));
const { aiScoringClient } = await import('./apiClient');
const client = vi.mocked(aiScoringClient);

/**
 * The operations openapi.yaml declares, as "METHOD /path/{param}".
 *
 * The services call the API with plain strings, so a renamed route in the contract does not show
 * up as a type error the way a renamed field does. Reading the contract here makes it show up as a
 * failing test instead. Only the shape this file needs is parsed: path keys at two spaces, HTTP
 * methods at four.
 */
function contractOperations(): string[] {
  const lines = readFileSync(resolve(__dirname, '../../openapi.yaml'), 'utf8').split('\n');
  const start = lines.findIndex(line => line === 'paths:');
  const operations: string[] = [];
  let path: string | null = null;
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break;
    const pathKey = /^ {2}(\/\S*):\s*$/.exec(line);
    if (pathKey) {
      path = pathKey[1];
      continue;
    }
    const method = /^ {4}(get|post|put|patch|delete):/.exec(line);
    if (method && path) operations.push(`${method[1].toUpperCase()} ${path}`);
  }
  return operations;
}

/** True when a concrete call such as "DELETE /chatbot/ask/abc" matches a declared operation. */
function isDeclared(call: string, operations: string[]): boolean {
  return operations.some(operation => {
    const pattern = operation.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{[^/}]+\}/g, '[^/]+');
    return new RegExp(`^${pattern}$`).test(call);
  });
}

const callOf = (method: string, url: string) => `${method} /${url}`;

function expectDeclared(call: string, operations: string[]): void {
  expect(isDeclared(call, operations), `${call} is not an operation in openapi.yaml`).toBe(true);
}

describe('chatService', () => {
  const operations = contractOperations();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('reads the contract it checks against', () => {
    expect(operations).toContain('POST /chatbot/search');
    expect(operations.length).toBeGreaterThan(20);
  });

  it('asks the assistant on a route the contract declares', async () => {
    client.post.mockResolvedValue({ data: { content: 'svar' } });

    await askAssistant({ content: 'Hvem kan Kotlin?' });

    const [url, body] = client.post.mock.calls[0];
    expectDeclared(callOf('POST', url as string), operations);
    expect(url).toBe('chatbot/ask');
    expect(body).toEqual({ content: 'Hvem kan Kotlin?' });
  });

  it('forgets a conversation on a route the contract declares, with the id escaped', async () => {
    client.delete.mockResolvedValue({});

    await clearConversation('a/b');

    const [url] = client.delete.mock.calls[0];
    expect(url).toBe('chatbot/ask/a%2Fb');
    expectDeclared(callOf('DELETE', url as string), operations);
  });

  it('searches on a route the contract declares', async () => {
    client.post.mockResolvedValue({ data: {} });

    await searchChat({ text: 'Kotlin' });

    const [url] = client.post.mock.calls[0];
    expectDeclared(callOf('POST', url as string), operations);
  });
});
