import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "./schema";

let db: ReturnType<typeof drizzle> | null = null;

export function getDatabase() {
  if (!db) {
    const sqlite = SQLite.openDatabaseSync("pempekpos.db");
    db = drizzle(sqlite, { schema });
  }
  return db;
}

export { schema };
