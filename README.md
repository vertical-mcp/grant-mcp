# Grant MCP

[한국어](#한국어) · [English](#english)

---

## English

MCP server for searching research grants across **NSF (US)**, **ERC (EU)**, and **KRF/NRF (Korea)**. Built for researchers, grant consultants, and PI's who need a single interface to query global funding opportunities.

### Why this exists

Existing grant search tools are siloed:
- NIH RePORTER MCP exists (US biomedical only)
- NSF, ERC, Korean grants have no unified MCP
- Researchers maintain 5+ bookmarks and copy-paste between sites

Grant MCP unifies these into a single Claude tool.

### Coverage (v0.1)

| Source | Country | API | Status |
|---|---|---|---|
| NSF Awards | US | `api.nsf.gov` | ✅ |
| ERC / CORDIS | EU | `cordis.europa.eu` | ✅ (basic) |
| KRF / NRF | Korea | `apis.data.go.kr` | ✅ (requires free API key) |
| Horizon Europe | EU | CORDIS overlap | W2 |
| UKRI Gateway | UK | `gtr.ukri.org` | W2 |

**Explicitly excluded:** NIH (covered by [GSA-TTS/nih-reporter-mcp-server](https://github.com/GSA-TTS/nih-reporter-mcp-server)).

### Installation

```bash
npm install -g @vertical-mcp/grant-mcp
```

### Claude Desktop Config

Add to `claude_desktop_config.json`:

**Windows:** `C:\Users\<you>\AppData\Roaming\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "grant-mcp": {
      "command": "npx",
      "args": ["@vertical-mcp/grant-mcp"],
      "env": {
        "KRF_API_KEY": "your-key-from-data.go.kr"
      }
    }
  }
}
```

The `KRF_API_KEY` is optional. Without it, NSF and ERC still work; Korean grants return empty.

### Tools

| Tool | Description |
|---|---|
| `search_grants` | Keyword/PI/institution search across NSF, ERC, KRF |
| `get_grant_detail` | Full detail for a specific grant ID (W2) |
| `list_upcoming_deadlines` | Upcoming application deadlines (W2) |

### Example Prompts

> "Find NSF grants on quantum sensing awarded after 2023"

> "What ERC Starting Grants in Spain focus on optical metrology?"

> "List all KRF grants from KAIST in 2024"

### Development

```bash
git clone https://github.com/vertical-mcp/grant-mcp
cd grant-mcp
npm install
npm run dev
```

### License

MIT

---

## 한국어

**NSF (미국) · ERC (유럽) · KRF/NRF (한국)** 연구비 데이터베이스를 단일 인터페이스로 검색하는 MCP 서버입니다. 연구자, 연구비 컨설턴트, 책임연구자가 글로벌 펀딩 기회를 한 번에 조회할 때 사용합니다.

### 왜 만들었나

기존 연구비 검색 도구는 분절되어 있습니다:
- NIH RePORTER MCP는 이미 존재 (미국 바이오 한정)
- NSF · ERC · 한국 연구비는 통합 MCP 부재
- 연구자는 사이트 5개 이상 북마크하고 복사·붙여넣기

Grant MCP는 이를 Claude 단일 도구로 통합합니다.

### 커버리지 (v0.1)

| 출처 | 국가 | API | 상태 |
|---|---|---|---|
| NSF Awards | 미국 | `api.nsf.gov` | ✅ |
| ERC / CORDIS | EU | `cordis.europa.eu` | ✅ (기본) |
| KRF / NRF | 한국 | `apis.data.go.kr` | ✅ (무료 API 키 필요) |
| Horizon Europe | EU | CORDIS 중복 | W2 |
| UKRI Gateway | 영국 | `gtr.ukri.org` | W2 |

**의도적 제외:** NIH (이미 [GSA-TTS/nih-reporter-mcp-server](https://github.com/GSA-TTS/nih-reporter-mcp-server) 존재)

### 설치

```bash
npm install -g @vertical-mcp/grant-mcp
```

### Claude Desktop 설정

`claude_desktop_config.json`에 추가:

**Windows:** `C:\Users\<사용자>\AppData\Roaming\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "grant-mcp": {
      "command": "npx",
      "args": ["@vertical-mcp/grant-mcp"],
      "env": {
        "KRF_API_KEY": "data.go.kr에서-발급받은-키"
      }
    }
  }
}
```

`KRF_API_KEY`는 선택. 없어도 NSF · ERC는 정상 동작, 한국 연구비만 빈 결과.

### KRF API 키 발급 (무료, 5분)

1. https://www.data.go.kr 접속
2. 로그인 후 "한국연구재단 연구과제 검색" 검색
3. "활용신청" 클릭, 자동 승인 (개발 계정)
4. 발급된 인증키를 위 `KRF_API_KEY`에 입력

### 사용 예시

> "양자 센싱 분야 2023년 이후 NSF 연구비 찾아줘"

> "스페인의 광계측 분야 ERC Starting Grant 알려줘"

> "2024년 KAIST 한국연구재단 과제 전부 나열해줘"

### 라이선스

MIT
