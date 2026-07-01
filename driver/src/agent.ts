import { randomUUID } from 'crypto';

import { buildToolPayload, normalizeAction, renderKoreanLog } from './actions.js';
import {
  DEFAULT_ACTION_DURATION_MS,
  DEFAULT_LOOP_DELAY_MS,
  DEFAULT_MAX_ITERATIONS,
  SAMPLE_REQUEST,
} from './config.js';
import { dim, error, info, warn } from './logger.js';
import { nextActionFromOpenRouter } from './openrouter.js';
import { ensureTranscript, postHook, readServerConfig } from './office.js';
import type { AgentConfig, DriverAction, ServerConfig } from './types.js';

export class PixelAgentRunner {
  readonly sessionId = randomUUID();
  readonly transcriptPath: string;
  private stopped = false;

  constructor(
    private readonly agent: AgentConfig,
    private readonly cwd: string,
    private readonly server: ServerConfig,
    private readonly token: string,
    private readonly options: {
      actionDurationMs?: number;
      dryRun?: boolean;
      maxIterations?: number;
    } = {},
  ) {
    this.transcriptPath = ensureTranscript({
      sessionId: this.sessionId,
      cwd,
      agentName: agent.name,
    });
  }

  async start(): Promise<void> {
    await this.sendSessionStart();
    info(`[${this.agent.name}] 🟢 세션 시작: ${this.sessionId.slice(0, 8)} (${this.agent.model})`);

    const maxIterations = this.options.maxIterations ?? DEFAULT_MAX_ITERATIONS;
    for (let i = 0; !this.stopped && i < maxIterations; i += 1) {
      await this.tick();
      if (i < maxIterations - 1) {
        await sleep(this.agent.loopDelayMs ?? DEFAULT_LOOP_DELAY_MS);
      }
    }

    await this.sendSessionEnd('max_iterations_complete');
    info(`[${this.agent.name}] ✅ 데모 루프 완료`);
  }

  stop(): void {
    this.stopped = true;
  }

  async tick(): Promise<void> {
    const action = await this.decideAction();
    info(renderKoreanLog(this.agent.name, action));

    const payload = buildToolPayload(action);
    if (!payload) {
      await this.sendStop();
      return;
    }

    await postHook(this.server, {
      session_id: this.sessionId,
      hook_event_name: 'PreToolUse',
      tool_name: payload.tool_name,
      tool_input: payload.tool_input,
    });
    await sleep(this.options.actionDurationMs ?? DEFAULT_ACTION_DURATION_MS);
    await postHook(this.server, { session_id: this.sessionId, hook_event_name: 'PostToolUse' });
    await this.sendStop();
  }

  private async decideAction(): Promise<DriverAction> {
    if (this.options.dryRun) {
      return demoAction(this.agent.name);
    }
    try {
      return await nextActionFromOpenRouter(this.agent, this.token, SAMPLE_REQUEST);
    } catch (err) {
      warn(
        `[${this.agent.name}] OpenRouter 응답 실패 → 잠시 대기: ${err instanceof Error ? err.message : String(err)}`,
      );
      return normalizeAction(null);
    }
  }

  private async sendSessionStart(): Promise<void> {
    await postHook(this.server, {
      session_id: this.sessionId,
      hook_event_name: 'SessionStart',
      source: 'startup',
      transcript_path: this.transcriptPath,
      cwd: this.cwd,
    });
  }

  private async sendStop(): Promise<void> {
    await postHook(this.server, { session_id: this.sessionId, hook_event_name: 'Stop' });
  }

  private async sendSessionEnd(reason: string): Promise<void> {
    await postHook(this.server, {
      session_id: this.sessionId,
      hook_event_name: 'SessionEnd',
      reason,
    });
  }
}

export function apiTokenForAgent(agent: AgentConfig): string {
  const envName = agent.apiKeyEnv ?? 'OPENROUTER_API_KEY';
  const token = process.env[envName];
  if (!token)
    throw new Error(`${envName} 환경변수가 필요해요. driver/.env 또는 ~/.hermes/.env 에 넣어줘.`);
  return token;
}

export async function runAgents(
  agents: AgentConfig[],
  cwd: string,
  options: { dryRun?: boolean; maxIterations?: number } = {},
): Promise<void> {
  const server = readServerConfig();
  dim(`Pixel Agents 서버 연결: http://127.0.0.1:${server.port}`);
  dim(`학교 시설 보수 요청 샘플: ${SAMPLE_REQUEST}`);

  const runners = agents.map((agent) => {
    const token = options.dryRun ? 'dry-run-token' : apiTokenForAgent(agent);
    return new PixelAgentRunner(agent, cwd, server, token, {
      dryRun: options.dryRun,
      maxIterations: options.maxIterations,
    });
  });

  const shutdown = () => {
    for (const runner of runners) runner.stop();
    error('\n드라이버 종료 신호를 받았어요. 루프를 멈출게요.');
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);

  await Promise.all(runners.map((runner) => runner.start()));
}

function demoAction(agentName: string): DriverAction {
  const byRole: Record<string, DriverAction> = {
    접수담당: {
      action: 'read',
      target: '시설보수요청.md',
      reason: '요청 장소와 위험 요소를 먼저 확인합니다',
    },
    분류담당: {
      action: 'write',
      target: '분류결과.md',
      reason: '누수·안전 분야로 접수 내용을 분류합니다',
    },
    우선순위담당: {
      action: 'run',
      target: '긴급도=상 학생안전=주의',
      reason: '수업 전 안전 조치가 필요합니다',
    },
    행정실장: {
      action: 'write',
      target: '행정실장_처리의견.md',
      reason: '현장 확인과 임시 통제 지시를 정리합니다',
    },
  };
  return byRole[agentName] ?? { action: 'rest', target: '', reason: '다음 작업을 기다립니다' };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
