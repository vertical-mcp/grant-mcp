/**
 * KRF / NRF (Korea National Research Foundation) provider.
 *
 * Korea Research Foundation publishes grant data via the public data portal:
 * https://www.data.go.kr (공공데이터포털)
 *
 * Endpoint candidates (W1 uses the most stable one):
 *   - apis.data.go.kr/1383000/...   (NRF research project search)
 *   - www.nrf.re.kr/api/...          (some endpoints public, some authd)
 *
 * For W1 we ship a basic implementation that requires KRF_API_KEY env var.
 * Without a key the provider returns an empty array gracefully.
 */

import { request } from "undici";
import type { Grant, SearchInput } from "../types.js";

const KRF_ENDPOINT =
  "https://apis.data.go.kr/1383000/openapi/service/researchProjectInfoService/getProjectList";

interface KRFItemRaw {
  projectNumber?: string;
  projectName?: string;       // Korean title
  projectNameEn?: string;     // English title (when available)
  researcherName?: string;    // 연구책임자
  organizationName?: string;  // 주관연구기관
  startDate?: string;
  endDate?: string;
  totalAmount?: string;       // KRW
  programName?: string;
  abstractKor?: string;
  abstractEng?: string;
}

function mapKRF(raw: KRFItemRaw): Grant {
  return {
    source: "krf",
    id: raw.projectNumber ?? "",
    // Prefer English title for international users; fall back to Korean.
    title: raw.projectNameEn ?? raw.projectName ?? "",
    pi: raw.researcherName,
    institution: raw.organizationName,
    country: "KR",
    award_amount: raw.totalAmount
      ? Number.parseFloat(raw.totalAmount.replace(/,/g, ""))
      : undefined,
    currency: "KRW",
    start_date: raw.startDate,
    end_date: raw.endDate,
    program: raw.programName,
    // Provide bilingual abstract when available
    abstract: raw.abstractEng
      ? raw.abstractEng
      : raw.abstractKor,
    url: raw.projectNumber
      ? `https://www.ntis.go.kr/ThSearchProjectList.do?searchWord=${encodeURIComponent(raw.projectNumber)}`
      : undefined,
  };
}

export async function searchKRF(input: SearchInput): Promise<Grant[]> {
  const apiKey = process.env.KRF_API_KEY;
  if (!apiKey) {
    // Graceful degradation: no key means we skip KRF rather than throwing.
    // User will see a non-fatal message in MCP server stderr.
    console.error(
      "KRF_API_KEY not set — skipping Korean grant search. " +
        "Get a free key at https://www.data.go.kr"
    );
    return [];
  }

  const params = new URLSearchParams();
  params.set("serviceKey", apiKey);
  params.set("searchWrd", input.query);
  params.set("numOfRows", String(Math.min(input.limit, 100)));
  params.set("pageNo", "1");
  params.set("resultType", "json");

  if (input.year_from) params.set("startYear", String(input.year_from));
  if (input.year_to) params.set("endYear", String(input.year_to));

  const url = `${KRF_ENDPOINT}?${params.toString()}`;

  try {
    const { statusCode, body } = await request(url, {
      method: "GET",
      headers: { "User-Agent": "grant-mcp/0.1.0" },
    });

    if (statusCode !== 200) {
      console.error(`KRF API returned ${statusCode}`);
      return [];
    }

    const data = (await body.json()) as {
      response?: {
        body?: {
          items?: { item?: KRFItemRaw[] | KRFItemRaw };
        };
      };
    };

    const itemsRaw = data.response?.body?.items?.item ?? [];
    const items = Array.isArray(itemsRaw) ? itemsRaw : [itemsRaw];
    return items.map(mapKRF);
  } catch (err) {
    console.error(
      `KRF provider error: ${err instanceof Error ? err.message : err}`
    );
    return [];
  }
}
