/**
 * Unified Grant schema — common shape across NSF, ERC, KRF.
 * Each provider maps its native fields into this structure.
 */

export interface Grant {
  source: "nsf" | "erc" | "krf";
  id: string;
  title: string;
  pi?: string;
  institution?: string;
  country?: string;
  award_amount?: number;
  currency?: string;
  start_date?: string;  // ISO 8601
  end_date?: string;
  program?: string;
  abstract?: string;
  url?: string;
}

export interface SearchInput {
  query: string;
  source: "nsf" | "erc" | "krf" | "all";
  year_from?: number;
  year_to?: number;
  limit: number;
}
