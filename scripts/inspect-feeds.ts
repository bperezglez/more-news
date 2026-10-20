import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fetchRawFeedsSnapshot } from "../src/lib/newspapers/fetch-raw-feeds";

function parseLimit(argv: string[]): number | undefined {
  const flag = argv.find((a) => a.startsWith("--limit="));
  if (flag) {
    const n = Number.parseInt(flag.split("=")[1] ?? "", 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  const idx = argv.indexOf("--limit");
  if (idx >= 0) {
    const n = Number.parseInt(argv[idx + 1] ?? "", 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  return undefined;
}

async function main() {
  const limitPerSource = parseLimit(process.argv.slice(2));

  const snapshot = await fetchRawFeedsSnapshot(
    limitPerSource !== undefined ? { limitPerSource } : {},
  );

  const dir = path.join(process.cwd(), "public", "data");
  await mkdir(dir, { recursive: true });
  const outPath = path.join(dir, "raw-feeds.json");
  await writeFile(outPath, JSON.stringify(snapshot), "utf8");

  console.log(`Portadas RSS (${snapshot.fetchedAt})`);
  console.log(`JSON: ${outPath}`);
  if (limitPerSource) {
    console.log(`Límite por medio: ${limitPerSource} ítems del XML`);
  } else {
    console.log("Sin límite: todos los ítems del XML por medio");
  }
  console.log("");

  for (const row of snapshot.bySource) {
    const { source } = row;
    if (row.error) {
      console.log(`[${source.name}] ERROR: ${row.error}`);
      continue;
    }
    console.log(
      `[${source.name}] xml=${row.totalItemsInXml} exportados=${row.exportedItemCount} ` +
        `válidos=${row.itemsPassingFilter} app≤40=${row.itemsInAppSlice} ` +
        `analizados≤${row.headlinesPerSourceBudget}`,
    );
    for (const item of row.items.slice(0, 12)) {
      const rank = item.filteredRank !== undefined ? `#${item.filteredRank + 1}` : "—";
      const flags = [
        item.includedInAppFeed ? "app" : null,
        item.analyzedInReadableFeed ? "sync" : null,
        !item.passesFilter ? "filtrado" : null,
      ]
        .filter(Boolean)
        .join(",");
      const date = item.publishedAt ?? "sin fecha";
      console.log(
        `  rss${item.feedRank + 1} ${rank} ${flags ? `[${flags}] ` : ""}${item.title.slice(0, 72)}`,
      );
      console.log(`       ${date} · ${item.link}`);
    }
    if (row.items.length > 12) {
      console.log(`  … y ${row.items.length - 12} más en el JSON`);
    }
    console.log("");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
