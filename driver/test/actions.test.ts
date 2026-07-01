import { describe, expect, it } from 'vitest';

import { buildToolPayload, normalizeAction, renderKoreanLog } from '../src/actions.js';
import type { DriverAction } from '../src/types.js';

describe('driver action mapping', () => {
  it('maps read actions to Claude Read hook payloads and Korean logs', () => {
    const action: DriverAction = { action: 'read', target: 'config.ts', reason: '설정 확인' };

    expect(buildToolPayload(action)).toEqual({
      tool_name: 'Read',
      tool_input: { file_path: 'config.ts' },
    });
    expect(renderKoreanLog('김대리', action)).toBe(
      '[김대리] 📖 config.ts 파일을 살펴보고 있어요 — 설정 확인',
    );
  });

  it('maps write and run actions to Edit and Bash payloads', () => {
    expect(buildToolPayload({ action: 'write', target: 'src/App.tsx', reason: '' })).toEqual({
      tool_name: 'Edit',
      tool_input: { file_path: 'src/App.tsx' },
    });

    expect(buildToolPayload({ action: 'run', target: 'npm test', reason: '검증' })).toEqual({
      tool_name: 'Bash',
      tool_input: { command: 'npm test' },
    });
  });

  it('normalizes invalid model output to safe rest action', () => {
    expect(normalizeAction({ action: 'delete', target: 123, reason: ['x'] })).toEqual({
      action: 'rest',
      target: '',
      reason: '응답 형식이 불안정해서 대기합니다',
    });
  });
});
