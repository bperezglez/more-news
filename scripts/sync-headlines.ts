import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchAllHeadlines } from "../src/lib/newspapers/fetch-headlines";

async function main() {
  const data = await fetchAllHeadlines();
  const payload = {
    ...data,
    fetchedAt: new Date().toISOString(),
  };

  const dir = path.join(process.cwd(), "public", "data");
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, "headlines.json"),
    JSON.stringify(payload),
    "utf8",
  );

  console.log(
    `Titulares sincronizados: ${data.headlines.length} (${payload.fetchedAt})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
