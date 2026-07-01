# School Facility Pixel Agents OpenRouter Driver

이 `driver/`는 AI 챔피언 고급과정 과제용으로 추가한 독립 실행형 OpenRouter 드라이버입니다.
기존 Pixel Agents가 Claude Code CLI 중심으로 화면 캐릭터를 움직이던 구조를 재사용하되,
Claude CLI를 실행하지 않고 OpenRouter 모델이 여러 학교 행정실 에이전트의 다음 행동을 결정합니다.

## 구현 개요

```text
OpenRouter Chat Completions
  → driver/src/openrouter.ts
  → driver/src/agent.ts
  → POST http://127.0.0.1:<port>/api/hooks/claude
  → Pixel Agents 서버/웹 화면
  → 접수담당, 분류담당, 우선순위담당, 행정실장 캐릭터 활동 표시
```

## 에이전트 역할

| 에이전트     | 역할                                    | 화면 행동 예시 |
| ------------ | --------------------------------------- | -------------- |
| 접수담당     | 보수 요청 핵심 내용과 위치 확인         | Read           |
| 분류담당     | 전기/수도/냉난방/안전 등 처리 분야 분류 | Edit           |
| 우선순위담당 | 학생 안전·수업 영향 기준 긴급도 판단    | Bash           |
| 행정실장     | 최종 처리 의견을 운영 보고서형으로 정리 | Edit           |

기본 샘플 요청:

> 본관 2층 과학실 천장에서 물이 떨어지고 바닥이 미끄럽습니다. 오늘 3교시 수업 전 확인이 필요합니다.

## 실행 방법

### 1) 의존성 설치 및 빌드

프로젝트 루트에서:

```bash
npm install
npm run build:driver
npm run build
```

### 2) OpenRouter 키 설정

`driver/.env` 파일을 만들고 아래처럼 입력합니다. `.env`는 `.gitignore` 처리되어 GitHub에 올라가지 않습니다.

```env
OPENROUTER_API_KEY=REPLACE_WITH_OPENROUTER_API_KEY
OPENROUTER_MODEL_1=qwen/qwen-2.5-7b-instruct
OPENROUTER_MODEL_2=qwen/qwen-2.5-7b-instruct
OPENROUTER_MODEL_3=openai/gpt-4o-mini
OPENROUTER_MODEL_4=qwen/qwen-2.5-7b-instruct
PIXEL_AGENT_MAX_ITERATIONS=3
```

키 없이 화면 연동만 확인하려면 `--dry-run`을 사용합니다.

### 3) Pixel Agents 서버 실행

터미널 A:

```bash
node dist/cli.js --port 3100
```

브라우저에서 `http://127.0.0.1:3100`을 엽니다.

### 4) 드라이버 실행

터미널 B:

```bash
npm run driver:dry-run -- --agents=4 --iterations=2
```

실제 OpenRouter 호출:

```bash
npm run driver:openrouter -- --agents=4 --iterations=2
```

## 추가/수정 파일

| 파일                       | 역할                                                                           |
| -------------------------- | ------------------------------------------------------------------------------ |
| `driver/src/config.ts`     | 학교 시설 보수 요청 에이전트 4명과 모델/환경변수 설정                          |
| `driver/src/openrouter.ts` | OpenRouter Chat Completions 호출 및 JSON 행동 파싱                             |
| `driver/src/agent.ts`      | 에이전트별 세션 시작, 행동 루프, 훅 이벤트 전송                                |
| `driver/src/office.ts`     | `~/.pixel-agents/server.json` 읽기, JSONL 트랜스크립트 생성, Hook POST         |
| `driver/src/actions.ts`    | `read/write/run/rest`를 Pixel Agents가 이해하는 `Read/Edit/Bash/Stop`으로 변환 |
| `driver/test/*.test.ts`    | 행동 매핑과 JSONL 경로 검증 테스트                                             |

## 검증 명령

```bash
npm run test:driver
npm run build:driver
node dist/cli.js --port 3100
npm run driver:dry-run -- --agents=4 --iterations=1
npm run driver:openrouter -- --agents=4 --iterations=1
```

## 보안

- API Key는 `driver/.env` 또는 `~/.hermes/.env`에서 읽습니다.
- `.env*`는 `.gitignore`에 포함되어 있어 공개 저장소에 올라가지 않습니다.
- 공개 저장소에는 `.env.example`과 실행 방법만 포함합니다.
