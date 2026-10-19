import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildReadableFeed } from "../src/lib/newspapers/build-feed";

async function main() {
  const feed = await buildReadableFeed();

  const dir = path.join(process.cwd(), "public", "data");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "headlines.json"), JSON.stringify(feed), "utf8");

  const hidden = feed.bySource.reduce((n, s) => n + s.hiddenCount, 0);
  console.log(
    `Titulares legibles: ${feed.headlines.length}, ocultos: ${hidden} (${feed.fetchedAt})`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
