/**
 * NSF Awards API provider.
 *
 * Docs: https://www.research.gov/common/webapi/awardapisearch-v1.htm
 * Endpoint: https://api.nsf.gov/services/v1/awards.json
 *
 * Public API, no auth required.
 */

import { request } from "undici";
import type { Grant, SearchInput } from "../types.js";

const NSF_ENDPOINT = "https://api.nsf.gov/services/v1/awards.json";

interface NSFAwardRaw {
  id?: string;
  title?: string;
  awardeeName?: string;
  piFirstName?: string;
  piLastName?: string;
  startDate?: string;
  expDate?: string;
  fundsObligatedAmt?: string;
  abstractText?: string;
  fundProgramName?: string;
}

interface NSFResponse {
  response: {
    award?: NSFAwardRaw[];
  };
}

function toISODate(usDate: string | undefined): string | undefined {
  if (!usDate) return undefined;
  // NSF returns MM/DD/YYYY — convert to ISO
  const m = usDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return usDate;
  return `${m[3]}-${m[1]}-${m[2]}`;
}

function mapNSF(raw: NSFAwardRaw): Grant {
  const pi = [raw.piFirstName, raw.piLastName].filter(Boolean).join(" ");
  return {
    source: "nsf",
    id: raw.id ?? "",
    title: raw.title ?? "",
    pi: pi || undefined,
    institution: raw.awardeeName,
    country: "US",
    award_amount: raw.fundsObligatedAmt
      ? Number.parseFloat(raw.fundsObligatedAmt)
      : undefined,
    currency: "USD",
    start_date: toISODate(raw.startDate),
    end_date: toISODate(raw.expDate),
    program: raw.fundProgramName,
    abstract: raw.abstractText,
    url: raw.id ? `https://www.nsf.gov/awardsearch/showAward?AWD_ID=${raw.id}` : undefined,
  };
}

export async function searchNSF(input: SearchInput): Promise<Grant[]> {
  const params = new URLSearchParams();
  params.set("keyword", input.query);
  params.set(
    "printFields",
    "id,title,awardeeName,piFirstName,piLastName,startDate,expDate,fundsObligatedAmt,abstractText,fundProgramName"
  );
  params.set("rpp", String(Math.min(input.limit, 25))); // NSF cap per page

  if (input.year_from) {
    params.set("dateStart", `01/01/${input.year_from}`);
  }
  if (input.year_to) {
    params.set("dateEnd", `12/31/${input.year_to}`);
  }

  const url = `${NSF_ENDPOINT}?${params.toString()}`;

  const { statusCode, body } = await request(url, {
    method: "GET",
    headers: { "User-Agent": "grant-mcp/0.1.0" },
  });

  if (statusCode !== 200) {
    throw new Error(`NSF API returned ${statusCode}`);
  }

  const data = (await body.json()) as NSFResponse;
  const awards = data.response?.award ?? [];
  return awards.map(mapNSF);
}
