import type { DriverAction, ToolPayload } from './types.js';

const ACTIONS = new Set(['read', 'write', 'run', 'rest']);

export function normalizeAction(raw: unknown): DriverAction {
  if (!raw || typeof raw !== 'object') return fallbackAction();
  const record = raw as Record<string, unknown>;
  const action = typeof record.action === 'string' ? record.action : '';
  if (!ACTIONS.has(action)) return fallbackAction();

  return {
    action: action as DriverAction['action'],
    target: typeof record.target === 'string' ? record.target.trim().slice(0, 120) : '',
    reason: typeof record.reason === 'string' ? record.reason.trim().slice(0, 160) : '',
  };
}

export function buildToolPayload(action: DriverAction): ToolPayload | null {
  switch (action.action) {
    case 'read':
      return { tool_name: 'Read', tool_input: { file_path: action.target || 'README.md' } };
    case 'write':
      return { tool_name: 'Edit', tool_input: { file_path: action.target || '작업노트.md' } };
    case 'run':
      return { tool_name: 'Bash', tool_input: { command: action.target || 'npm test' } };
    case 'rest':
      return null;
  }
}

export function renderKoreanLog(agentName: string, action: DriverAction): string {
  const reason = action.reason ? ` — ${action.reason}` : '';
  switch (action.action) {
    case 'read':
      return `[${agentName}] 📖 ${action.target || '자료'} 파일을 살펴보고 있어요${reason}`;
    case 'write':
      return `[${agentName}] ✏️ ${action.target || '작업노트'} 를 수정하는 중이에요${reason}`;
    case 'run':
      return `[${agentName}] ⚙️ ${action.target || '명령'} 명령을 실행하고 있어요${reason}`;
    case 'rest':
      return `[${agentName}] ☕ 잠깐 쉬는 중이에요${reason}`;
  }
}

function fallbackAction(): DriverAction {
  return {
    action: 'rest',
    target: '',
    reason: '응답 형식이 불안정해서 대기합니다',
  };
}
