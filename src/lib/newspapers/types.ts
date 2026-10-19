export type NewspaperId = string;

export interface NewspaperSource {
  id: NewspaperId;
  name: string;
  feedUrl: string;
  website: string;
  /** Color de acento en la UI (hex) */
  accent: string;
  enabled?: boolean;
}

export interface Headline {
  id: string;
  title: string;
  link: string;
  summary?: string;
  publishedAt?: string;
  imageUrl?: string;
  sourceId: NewspaperId;
  sourceName: string;
}

export interface ArticleContent {
  title: string;
  content: string;
  excerpt?: string;
  byline?: string;
  siteName?: string;
  sourceUrl: string;
}
