import * as fs from 'fs';
import * as path from 'path';

import type { AgentConfig } from './types.js';

function loadDotEnv(filePath: string): void {
  if (!fs.existsSync(filePath)) return;

  const text = fs.readFileSync(filePath, 'utf-8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;
    const [, key, raw] = match;
    if (process.env[key] !== undefined) continue;
    const value = raw.replace(/^['"]|['"]$/g, '').trim();
    process.env[key] = value;
  }
}

export function loadDriverEnv(): void {
  loadDotEnv(path.resolve(process.cwd(), '.env'));
  loadDotEnv(path.resolve(process.cwd(), 'driver/.env'));
  loadDotEnv(path.resolve(process.env.HOME ?? '', '.hermes/.env'));
}

loadDriverEnv();

export const AGENTS: AgentConfig[] = [
  {
    name: '접수담당',
    model: process.env.OPENROUTER_MODEL_1 ?? 'qwen/qwen-2.5-7b-instruct',
    systemPrompt:
      '당신은 학교 행정실의 시설 보수 요청 접수담당입니다. 요청 내용을 읽고 핵심 민원/위치를 요약합니다. 반드시 JSON 객체 하나만 답하세요.',
  },
  {
    name: '분류담당',
    model: process.env.OPENROUTER_MODEL_2 ?? 'qwen/qwen-2.5-7b-instruct',
    systemPrompt:
      '당신은 학교 시설관리 분류담당입니다. 전기, 수도, 냉난방, 교실, 안전, 기타 중 적절한 처리 분야를 판단합니다. 반드시 JSON 객체 하나만 답하세요.',
  },
  {
    name: '우선순위담당',
    model: process.env.OPENROUTER_MODEL_3 ?? 'openai/gpt-4o-mini',
    systemPrompt:
      '당신은 학교 안전 우선순위 판단 담당입니다. 학생 안전, 수업 영향, 긴급도 기준으로 다음 조치를 정합니다. 반드시 JSON 객체 하나만 답하세요.',
  },
  {
    name: '행정실장',
    model:
      process.env.OPENROUTER_MODEL_4 ??
      process.env.OPENROUTER_MODEL_2 ??
      'qwen/qwen-2.5-7b-instruct',
    systemPrompt:
      '당신은 학교 행정실장입니다. 접수, 분류, 우선순위 판단을 종합해 운영 보고서형 한 줄 의견을 냅니다. 반드시 JSON 객체 하나만 답하세요.',
  },
];

export const DEFAULT_LOOP_DELAY_MS = Number(process.env.PIXEL_AGENT_LOOP_DELAY_MS ?? 2500);
export const DEFAULT_ACTION_DURATION_MS = Number(
  process.env.PIXEL_AGENT_ACTION_DURATION_MS ?? 1600,
);
export const DEFAULT_MAX_ITERATIONS = Number(process.env.PIXEL_AGENT_MAX_ITERATIONS ?? 3);
export const DEFAULT_WORKSPACE = process.env.PIXEL_AGENT_WORKSPACE ?? process.cwd();

export const SAMPLE_REQUEST =
  process.env.PIXEL_AGENT_SAMPLE_REQUEST ??
  '본관 2층 과학실 천장에서 물이 떨어지고 바닥이 미끄럽습니다. 오늘 3교시 수업 전 확인이 필요합니다.';
