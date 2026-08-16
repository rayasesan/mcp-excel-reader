import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as XLSX from "xlsx";
import { z } from "zod";

const server = new McpServer({
  name: "mcp-excel-gratis",
  version: "1.0.0",
});

server.tool(
  "read_excel",
  {
    filePath: z.string().describe("Absolute path to the Excel file (.xlsx, .xls)"),
  },
  async ({ filePath }) => {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      const columnNames = rows.length > 0 ? Object.keys(rows[0]) : [];
      const summary = {
        filePath,
        sheetName,
        rowCount: rows.length,
        columnCount: columnNames.length,
        columnNames,
        firstFiveRows: rows.slice(0, 5),
      };

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to read Excel file: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
