import { promises as fs } from "node:fs";
import { join } from "node:path";

const DATA_FILE = join(process.cwd(), "data", "shopping-lists.json");

async function readLists() {
  try {
    console.error("Reading from:", DATA_FILE);
    const data = await fs.readFile(DATA_FILE, "utf-8");
    const parsed = JSON.parse(data);
    
    // Handle new format with categories
    if (parsed.categories && Array.isArray(parsed.lists)) {
      return {
        categories: parsed.categories,
        lists: parsed.lists.map(list => ({
          name: list.name,
          items: list.items.map(item =>
            typeof item === "string"
              ? { name: item, quantity: 1, checked: false, category: "Default" }
              : { ...item, category: item.category || "Default" }
          ),
        }))
      };
    }
    
    // Handle old format (array of lists)
    if (Array.isArray(parsed)) {
      // Convert old format to new format
      const converted = {
        categories: ["Default"],
        lists: parsed.map(list => ({
          name: list.name,
          items: list.items.map(item =>
            typeof item === "string"
              ? { name: item, quantity: 1, checked: false, category: "Default" }
              : { ...item, category: item.category || "Default" }
          ),
        }))
      };
      console.error("Successfully converted lists:", converted);
      return converted;
    }
  }
  catch (error) {
    console.error("Error reading lists:", error);
    // Only return empty array, let frontend handle defaults
    return [];
  }
}

async function writeLists(data) {
  try {
    if (!data.categories || !Array.isArray(data.lists)) {
      throw new TypeError("Invalid data format - must have categories and lists array");
    }

    const dataDir = join(process.cwd(), "data");
    console.error("Creating directory:", dataDir);
    await fs.mkdir(dataDir, { recursive: true });
    console.error("Writing to file:", DATA_FILE);

    // Ensure we're writing a clean object with proper item format
    const cleanData = {
      categories: [...new Set(data.categories)], // Remove duplicates
      lists: data.lists.map(list => ({
        name: String(list.name),
        items: Array.isArray(list.items)
          ? list.items.map((item) => {
              if (typeof item === "string") {
                return { 
                  name: item, 
                  quantity: 1, 
                  checked: false,
                  category: "Default"
                };
              }
              return {
                name: String(item.name || "Unnamed Item"),
                quantity: Number(item.quantity || 1),
                checked: Boolean(item.checked),
                category: String(item.category || "Default")
              };
            })
          : [],
      }))
    };

    await fs.writeFile(DATA_FILE, JSON.stringify(cleanData, null, 2));
    console.error("Successfully wrote data:", cleanData);
    return cleanData;
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
      if (!body.categories || !Array.isArray(body.lists)) {
        throw createError({
          statusCode: 400,
          message: "Invalid request body - must have categories and lists array",
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
