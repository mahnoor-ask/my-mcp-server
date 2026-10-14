
const express = require("express");
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { z } = require("zod");

const app = express();
app.use(express.json());

function createMcpServer() {
  const server = new McpServer({
    name: "my-mcp-server",
    version: "1.0.0",
  });

  server.registerTool(
    "add_numbers",
    {
      title: "Add Two Numbers",
      description: "Do numbers ko add karta hai.",
      inputSchema: {
        a: z.number().describe("Pehla number"),
        b: z.number().describe("Doosra number"),
      },
    },
    async ({ a, b }) => ({
      content: [{ type: "text", text: `Jawab: ${a + b}` }],
    })
  );

  return server;
}

app.post("/mcp", async (req, res) => {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP request error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  } finally {
    await transport.close();
    await server.close();
  }
});

app.get("/", (_req, res) => {
  res.send("MCP server is running.");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`MCP server listening on port ${PORT}`);
});
