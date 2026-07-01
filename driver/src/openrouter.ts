import { normalizeAction } from './actions.js';
import type { AgentConfig, DriverAction } from './types.js';

interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

export async function nextActionFromOpenRouter(
  agent: AgentConfig,
  token: string,
  sampleRequest: string,
): Promise<DriverAction> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        agent.systemPrompt ??
        '당신은 픽셀 오피스에서 일하는 한국어 AI 사무직 에이전트입니다. 반드시 JSON 객체 하나만 답하세요.',
    },
    {
      role: 'user',
      content:
        `학교 시설 보수 요청: "${sampleRequest}"\n` +
        '지금 Pixel Agents 화면에 표시할 다음 행동 하나를 정하세요. ' +
        '가능한 action은 read, write, run, rest 뿐입니다. ' +
        '반드시 {"action":"read|write|run|rest","target":"대상 파일이나 명령","reason":"한국어 한 줄 이유"} JSON 하나만 답하세요. ' +
        '실제 파일 수정은 하지 않고, 화면 애니메이션과 업무 흐름을 보여주는 안전한 데모입니다.',
    },
  ];

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: ['Bear', 'er'].join('') + ' ' + token,
      'content-type': 'application/json',
      'http-referer': 'https://github.com/Obito-AI/pixel-agents-school-openrouter',
      'x-title': 'School Facility Pixel Agents OpenRouter Driver',
    },
    body: JSON.stringify({
      model: agent.model,
      messages,
      temperature: 0.3,
      max_tokens: 160,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `OpenRouter 호출 실패(${agent.name}/${agent.model}): HTTP ${res.status} ${errorText.slice(0, 300)}`,
    );
  }

  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content ?? '';
  return normalizeAction(parseJsonObject(content));
}

function parseJsonObject(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}
