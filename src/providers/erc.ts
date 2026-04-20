/**
 * ERC / CORDIS provider.
 *
 * CORDIS is the EU research results database. ERC (European Research Council)
 * grants are a subset. Uses the public CORDIS search API.
 *
 * Docs: https://cordis.europa.eu/about/api
 * Alt endpoint: https://cordis.europa.eu/search
 *
 * Note: The stable JSON search endpoint is under CORDIS Open Data. For W1
 * we use the simple search fallback. In W2 we migrate to the full API.
 */

import { request } from "undici";
import type { Grant, SearchInput } from "../types.js";

const CORDIS_SEARCH = "https://cordis.europa.eu/search";

interface CordisProjectRaw {
  rcn?: string;
  id?: string;
  title?: string;
  acronym?: string;
  startDate?: string;
  endDate?: string;
  totalCost?: string;
  ecMaxContribution?: string;
  coordinator?: string;
  coordinatorCountry?: string;
  programme?: string;
  objective?: string;
}

function mapERC(raw: CordisProjectRaw): Grant {
  const amount = raw.ecMaxContribution ?? raw.totalCost;
  return {
    source: "erc",
    id: raw.id ?? raw.rcn ?? "",
    title: raw.title ?? raw.acronym ?? "",
    institution: raw.coordinator,
    country: raw.coordinatorCountry ?? "EU",
    award_amount: amount ? Number.parseFloat(amount) : undefined,
    currency: "EUR",
    start_date: raw.startDate,
    end_date: raw.endDate,
    program: raw.programme,
    abstract: raw.objective,
    url: raw.id
      ? `https://cordis.europa.eu/project/id/${raw.id}`
      : undefined,
  };
}

export async function searchERC(input: SearchInput): Promise<Grant[]> {
  // CORDIS public search - format=json, contenttype=project
  // Filter to ERC-funded projects by programme code prefix "ERC"
  const params = new URLSearchParams();
  params.set("q", `contenttype='project' AND programme='ERC*' AND '${input.query}'`);
  params.set("p", "1");
  params.set("num", String(Math.min(input.limit, 50)));
  params.set("srt", "Relevance:decreasing");
  params.set("format", "json");

  const url = `${CORDIS_SEARCH}?${params.toString()}`;

  try {
    const { statusCode, body } = await request(url, {
      method: "GET",
      headers: {
        "User-Agent": "grant-mcp/0.1.0",
        "Accept": "application/json",
      },
    });

    if (statusCode !== 200) {
      // CORDIS intermittently returns HTML — gracefully degrade
      return [];
    }

    const raw = (await body.json()) as {
      hits?: { hit?: { summary?: CordisProjectRaw }[] };
    };

    const hits = raw.hits?.hit ?? [];
    return hits
      .map((h) => h.summary)
      .filter((s): s is CordisProjectRaw => s !== undefined)
      .map(mapERC);
  } catch (err) {
    // Fallback: return empty array rather than breaking the merged response.
    // Full CORDIS Open Data migration is tracked for W2.
    console.error(`ERC provider degraded: ${err instanceof Error ? err.message : err}`);
    return [];
  }
}
