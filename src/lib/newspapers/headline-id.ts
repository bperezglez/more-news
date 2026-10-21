import { createHash } from "crypto";

export function stableHeadlineId(link: string, title: string): string {
  return createHash("sha256").update(`${link}|${title}`).digest("hex").slice(0, 16);
}
