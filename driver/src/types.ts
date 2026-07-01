export type ActionKind = 'read' | 'write' | 'run' | 'rest';

export interface DriverAction {
  action: ActionKind;
  target: string;
  reason: string;
}

export interface AgentConfig {
  name: string;
  model: string;
  systemPrompt?: string;
  apiKeyEnv?: string;
  loopDelayMs?: number;
}

export interface ToolPayload {
  tool_name: 'Read' | 'Edit' | 'Bash';
  tool_input: Record<string, string>;
}

export interface HookPayload {
  session_id: string;
  hook_event_name:
    | 'SessionStart'
    | 'PreToolUse'
    | 'PostToolUse'
    | 'Stop'
    | 'Notification'
    | 'SessionEnd';
  transcript_path?: string;
  cwd?: string;
  source?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  notification_type?: string;
  reason?: string;
}

export interface ServerConfig {
  port: number;
  pid: number;
  token: string;
  startedAt: number;
}
