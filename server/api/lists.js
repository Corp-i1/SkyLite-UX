import { promises as fs } from "node:fs";
import { join } from "node:path";

const DATA_FILE = join(process.cwd(), "data", "shopping-lists.json");

async function readLists() {
  try {
    console.error("Reading from:", DATA_FILE);
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      throw new TypeError("Invalid data format");
    }

    // Convert old format to new format if needed
    const converted = parsed.map(list => ({
      name: list.name,
      items: list.items.map(item =>
        typeof item === "string"
          ? { name: item, quantity: 1, checked: false }
          : item,
      ),
    }));

    console.error("Successfully read lists:", converted);
    return converted;
  }
  catch (error) {
    console.error("Error reading lists:", error);
    // Only return empty array, let frontend handle defaults
    return [];
  }
}

async function writeLists(lists) {
  try {
    if (!Array.isArray(lists)) {
      throw new TypeError("Lists must be an array");
    }

    const dataDir = join(process.cwd(), "data");
    console.error("Creating directory:", dataDir);
    await fs.mkdir(dataDir, { recursive: true });
    console.error("Writing to file:", DATA_FILE);

    // Ensure we're writing a clean object with proper item format
    const cleanLists = lists.map(list => ({
      name: String(list.name),
      items: Array.isArray(list.items)
        ? list.items.map((item) => {
            if (typeof item === "string") {
              return { name: item, quantity: 1, checked: false };
            }
            return {
              name: String(item.name || "Unnamed Item"),
              quantity: Number(item.quantity || 1),
              checked: Boolean(item.checked),
            };
          })
        : [],
    }));

    await fs.writeFile(DATA_FILE, JSON.stringify(cleanLists, null, 2));
    console.error("Successfully wrote lists:", cleanLists);
    return cleanLists;
  }
  catch (error) {
    console.error("Error writing lists:", error);
    throw error;
  }
}

export default defineEventHandler(async (event) => {
  try {
    console.error("Handling request:", event.node.req.method);

    if (event.node.req.method === "GET") {
      return await readLists();
    }
    if (event.node.req.method === "POST") {
      const body = await readBody(event);
      if (!Array.isArray(body)) {
        throw createError({
          statusCode: 400,
          message: "Invalid request body - must be an array",
        });
      }
      console.error("Received POST body:", body);
      await writeLists(body);
      return { ok: true };
    }
  }
  catch (error) {
    console.error("Error in handler:", error);
    throw createError({
      statusCode: 500,
      message: error.message,
    });
  }
});
