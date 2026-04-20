#!/usr/bin/env node
/**
 * Grant MCP Server
 *
 * MCP server for searching research grants across NSF (US), ERC (EU),
 * and KRF/NRF (Korea) databases. Excludes NIH (already covered by
 * existing MCP servers).
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { searchNSF } from "./providers/nsf.js";
import { searchERC } from "./providers/erc.js";
import { searchKRF } from "./providers/krf.js";

// --------------------------------------------------------------------------
// Tool input schemas
// --------------------------------------------------------------------------

const SearchGrantsSchema = z.object({
  query: z.string().describe("Keyword, PI name, or institution to search"),
  source: z
    .enum(["nsf", "erc", "krf", "all"])
    .default("all")
    .describe("Grant database: nsf (US), erc (EU), krf (Korea), or all"),
  year_from: z.number().int().optional(),
  year_to: z.number().int().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

const GetGrantDetailSchema = z.object({
  source: z.enum(["nsf", "erc", "krf"]),
  grant_id: z.string(),
});

const ListUpcomingDeadlinesSchema = z.object({
  source: z.enum(["nsf", "erc", "krf", "all"]).default("all"),
  days_ahead: z.number().int().min(1).max(365).default(90),
});

// --------------------------------------------------------------------------
// Server setup
// --------------------------------------------------------------------------

const server = new Server(
  {
    name: "grant-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_grants",
      description:
        "Search research grants across NSF (US), ERC (EU), KRF/NRF (Korea) " +
        "by keyword, PI name, or institution. Returns grant titles, award " +
        "amounts, PIs, and institution info.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
          source: {
            type: "string",
            enum: ["nsf", "erc", "krf", "all"],
            default: "all",
          },
          year_from: { type: "number" },
          year_to: { type: "number" },
          limit: { type: "number", default: 20 },
        },
        required: ["query"],
      },
    },
    {
      name: "get_grant_detail",
      description:
        "Get full detail of a specific grant by ID from NSF, ERC, or KRF.",
      inputSchema: {
        type: "object",
        properties: {
          source: { type: "string", enum: ["nsf", "erc", "krf"] },
          grant_id: { type: "string" },
        },
        required: ["source", "grant_id"],
      },
    },
    {
      name: "list_upcoming_deadlines",
      description:
        "List upcoming grant application deadlines within the next N days " +
        "across NSF, ERC, KRF funding programs.",
      inputSchema: {
        type: "object",
        properties: {
          source: {
            type: "string",
            enum: ["nsf", "erc", "krf", "all"],
            default: "all",
          },
          days_ahead: { type: "number", default: 90 },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "search_grants": {
        const input = SearchGrantsSchema.parse(args);
        const providers =
          input.source === "all"
            ? ["nsf", "erc", "krf"]
            : [input.source];

        const results = await Promise.allSettled(
          providers.map((p) => {
            if (p === "nsf") return searchNSF(input);
            if (p === "erc") return searchERC(input);
            if (p === "krf") return searchKRF(input);
            return Promise.resolve([]);
          })
        );

        const merged = results
          .filter((r) => r.status === "fulfilled")
          .flatMap((r) => (r as PromiseFulfilledResult<unknown[]>).value);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(merged, null, 2),
            },
          ],
        };
      }

      case "get_grant_detail": {
        const input = GetGrantDetailSchema.parse(args);
        // TODO: implement per-source detail fetch in W1 Day 3
        return {
          content: [
            {
              type: "text",
              text: `get_grant_detail not yet implemented for ${input.source}`,
            },
          ],
        };
      }

      case "list_upcoming_deadlines": {
        const input = ListUpcomingDeadlinesSchema.parse(args);
        // TODO: implement deadline scraper in W2
        return {
          content: [
            {
              type: "text",
              text: `list_upcoming_deadlines not yet implemented (source=${input.source}, days=${input.days_ahead})`,
            },
          ],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (err) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
      isError: true,
    };
  }
});

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("grant-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
