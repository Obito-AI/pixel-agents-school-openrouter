import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import type { HookPayload, ServerConfig } from './types.js';

export function normalizeProjectPath(cwd: string): string {
  return cwd.replace(/[^a-zA-Z0-9-]/g, '-');
}

export function projectDirForCwd(cwd: string): string {
  return path.join(os.homedir(), '.claude', 'projects', normalizeProjectPath(cwd));
}

export function transcriptPathForSession(cwd: string, sessionId: string): string {
  return path.join(projectDirForCwd(cwd), `${sessionId}.jsonl`);
}

export function buildTranscriptLine(input: {
  sessionId: string;
  cwd: string;
  agentName: string;
  timestamp?: Date;
}): string {
  return (
    JSON.stringify({
      type: 'assistant',
      sessionId: input.sessionId,
      cwd: input.cwd,
      content: `Pixel Agent ${input.agentName} 세션 시작`,
      timestamp: (input.timestamp ?? new Date()).toISOString(),
    }) + '\n'
  );
}

export function ensureTranscript(input: {
  sessionId: string;
  cwd: string;
  agentName: string;
}): string {
  const transcriptPath = transcriptPathForSession(input.cwd, input.sessionId);
  fs.mkdirSync(path.dirname(transcriptPath), { recursive: true });
  if (!fs.existsSync(transcriptPath)) {
    fs.writeFileSync(transcriptPath, buildTranscriptLine(input), 'utf-8');
  }
  return transcriptPath;
}

export function readServerConfig(): ServerConfig {
  const serverJsonPath = path.join(os.homedir(), '.pixel-agents', 'server.json');
  if (!fs.existsSync(serverJsonPath)) {
    throw new Error(
      `Pixel Agents 서버를 찾지 못했어요: ${serverJsonPath}. 먼저 npx pixel-agents 를 실행해줘.`,
    );
  }
  return JSON.parse(fs.readFileSync(serverJsonPath, 'utf-8')) as ServerConfig;
}

export async function postHook(config: ServerConfig, payload: HookPayload): Promise<void> {
  const res = await fetch(`http://127.0.0.1:${config.port}/api/hooks/claude`, {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + config.token,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`hook POST 실패: HTTP ${res.status} ${await res.text()}`);
  }
}
