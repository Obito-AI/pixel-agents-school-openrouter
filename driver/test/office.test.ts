import { describe, expect, it } from 'vitest';

import { buildTranscriptLine, projectDirForCwd } from '../src/office.js';

describe('office bridge helpers', () => {
  it('builds minimal Claude-compatible JSONL transcript lines', () => {
    const line = buildTranscriptLine({
      sessionId: 'session-1',
      cwd: '/tmp/workspace',
      agentName: '김대리',
      timestamp: new Date('2026-06-25T00:00:00.000Z'),
    });

    expect(JSON.parse(line)).toEqual({
      type: 'assistant',
      sessionId: 'session-1',
      cwd: '/tmp/workspace',
      content: 'Pixel Agent 김대리 세션 시작',
      timestamp: '2026-06-25T00:00:00.000Z',
    });
    expect(line.endsWith('\n')).toBe(true);
  });

  it('uses Pixel Agents Claude project path normalization for JSONL adoption', () => {
    expect(projectDirForCwd('/Users/aion/my app')).toMatch(
      /\.claude\/projects\/-Users-aion-my-app$/,
    );
  });
});
