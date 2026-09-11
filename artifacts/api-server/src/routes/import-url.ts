import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

interface BookMeta {
  title?: string;
  author?: string;
  description?: string;
  coverUrl?: string;
  isbn?: string;
  publishedYear?: number;
  category?: string;
  fileUrl?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function decodeHtmlEntities(str?: string): string | undefined {
  if (!str) return undefined;
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveUrl(relativeOrAbsolute: string | undefined, baseUrl: string): string | undefined {
  if (!relativeOrAbsolute) return undefined;
  try {
    return new URL(relativeOrAbsolute, baseUrl).toString();
  } catch {
    return relativeOrAbsolute;
  }
}

function extractMeta(html: string, name: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i"),
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeHtmlEntities(m[1]);
  }
  return undefined;
}

function extractTagText(html: string, tagName: string): string | undefined {
  const re = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const m = html.match(re);
  if (m?.[1]) {
    const cleaned = m[1].replace(/<[^>]+>/g, "").trim();
    return decodeHtmlEntities(cleaned);
  }
  return undefined;
}

function extractJsonLd(html: string): BookMeta {
  const result: BookMeta = {};
  const matches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of matches) {
    try {
      const data = JSON.parse(m[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item["@type"] === "Book" || item["@type"] === "AudioBook" || item["@type"] === "CreativeWork" || item["@type"] === "Product") {
          if (item.name) result.title = item.name;
          if (item.author) {
            if (typeof item.author === "string") result.author = item.author;
            else if (item.author.name) result.author = item.author.name;
            else if (Array.isArray(item.author)) result.author = item.author.map((a: any) => a.name || a).join(", ");
          }
          if (item.description) result.description = item.description.replace(/<[^>]+>/g, "").trim();
          if (item.image) result.coverUrl = typeof item.image === "string" ? item.image : item.image.url;
          if (item.isbn) result.isbn = item.isbn;
          if (item.datePublished) result.publishedYear = parseInt(item.datePublished);
          if (item.genre) result.category = item.genre;
        }
      }
    } catch { /* skip invalid JSON-LD */ }
  }
  return result;
}

function yearFromString(s?: string): number | undefined {
  if (!s) return undefined;
  const m = s.match(/\b(1[5-9]\d\d|20\d\d)\b/);
  return m ? parseInt(m[1]) : undefined;
}

// ─── Google Books API ─────────────────────────────────────────────────────────

async function fromGoogleBooks(url: string): Promise<BookMeta> {
  let volumeId: string | undefined;
  const idMatch = url.match(/[?&]id=([^&]+)/);
  if (idMatch) volumeId = idMatch[1];
  const pathMatch = url.match(/books\/([A-Za-z0-9_-]{8,})/);
  if (!volumeId && pathMatch) volumeId = pathMatch[1];

  if (volumeId) {
    const apiUrl = `https://www.googleapis.com/books/v1/volumes/${volumeId}`;
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json() as any;
      const info = data.volumeInfo || {};
      return {
        title: decodeHtmlEntities(info.title),
        author: info.authors?.join(", "),
        description: decodeHtmlEntities((info.description || "").replace(/<[^>]+>/g, "").trim()),
        coverUrl: info.imageLinks?.extraLarge || info.imageLinks?.large || info.imageLinks?.medium || info.imageLinks?.thumbnail?.replace("http:", "https:"),
        isbn: info.industryIdentifiers?.find((x: any) => x.type === "ISBN_13")?.identifier || info.industryIdentifiers?.[0]?.identifier,
        publishedYear: yearFromString(info.publishedDate),
        category: info.categories?.[0],
        fileUrl: info.canonicalVolumeLink || info.infoLink || url,
      };
    }
  }

  return {};
}

// ─── Open Library ─────────────────────────────────────────────────────────────

async function fromOpenLibrary(url: string): Promise<BookMeta> {
  const key = url.match(/\/(OL\w+)/)?.[1];
  if (!key) return {};

  const apiUrl = `https://openlibrary.org/books/${key}.json`;
  const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return {};

  const data = await res.json() as any;
  const result: BookMeta = {
    title: decodeHtmlEntities(data.title),
    description: decodeHtmlEntities(typeof data.description === "string" ? data.description : data.description?.value),
    publishedYear: yearFromString(data.publish_date),
    isbn: data.isbn_13?.[0] || data.isbn_10?.[0],
  };

  if (data.authors?.length) {
    try {
      const authorRes = await fetch(`https://openlibrary.org${data.authors[0].key}.json`, { signal: AbortSignal.timeout(5000) });
      if (authorRes.ok) {
        const a = await authorRes.json() as any;
        result.author = a.name;
      }
    } catch { /* skip */ }
  }

  if (data.covers?.[0]) {
    result.coverUrl = `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`;
  }

  result.fileUrl = url;
  return result;
}

// ─── Generic Web Scraper ──────────────────────────────────────────────────────

async function fromGenericUrl(url: string): Promise<BookMeta> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch website (${res.status} ${res.statusText})`);
  const html = await res.text();

  // 1. JSON-LD structured data
  const jsonLd = extractJsonLd(html);

  // 2. OpenGraph & Twitter tags
  const rawCoverUrl = jsonLd.coverUrl || extractMeta(html, "og:image") || extractMeta(html, "twitter:image") || extractMeta(html, "image");
  const coverUrl = resolveUrl(rawCoverUrl, url);

  const rawTitle = jsonLd.title || extractMeta(html, "og:title") || extractMeta(html, "twitter:title") || extractTagText(html, "title") || extractTagText(html, "h1");
  const title = decodeHtmlEntities(rawTitle?.replace(/\|.*$/g, "").replace(/-.*$/g, "").trim());

  const rawAuthor = jsonLd.author || extractMeta(html, "book:author") || extractMeta(html, "author") || extractMeta(html, "article:author") || extractMeta(html, "twitter:creator");
  const author = decodeHtmlEntities(rawAuthor);

  const rawDesc = jsonLd.description || extractMeta(html, "og:description") || extractMeta(html, "twitter:description") || extractMeta(html, "description");
  const description = decodeHtmlEntities(rawDesc);

  const isbn = jsonLd.isbn || extractMeta(html, "books:isbn") || extractMeta(html, "isbn");
  const publishedYear = jsonLd.publishedYear || yearFromString(extractMeta(html, "book:release_date") || extractMeta(html, "datePublished") || extractMeta(html, "publish_date"));

  // First image fallback if no OpenGraph cover is found
  let finalCoverUrl = coverUrl;
  if (!finalCoverUrl) {
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+\.(?:png|jpg|jpeg|webp))["']/i);
    if (imgMatch?.[1]) {
      finalCoverUrl = resolveUrl(imgMatch[1], url);
    }
  }

  const result: BookMeta = {
    title,
    author: author || "Unknown Author",
    description: description || `Imported resource from ${new URL(url).hostname}`,
    coverUrl: finalCoverUrl,
    isbn,
    publishedYear,
    fileUrl: url,
  };

  // If title was found but metadata is sparse, attempt Google Books keyword enrichment
  if (result.title && (!result.coverUrl || !result.description || !result.author || result.author === "Unknown Author")) {
    try {
      const searchRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(result.title)}&maxResults=1`, { signal: AbortSignal.timeout(4000) });
      if (searchRes.ok) {
        const searchData = await searchRes.json() as any;
        const item = searchData.items?.[0]?.volumeInfo;
        if (item) {
          if (!result.author || result.author === "Unknown Author") result.author = item.authors?.join(", ") || result.author;
          if (!result.description || result.description.length < 30) result.description = item.description || result.description;
          if (!result.coverUrl) result.coverUrl = item.imageLinks?.thumbnail?.replace("http:", "https:");
          if (!result.isbn) result.isbn = item.industryIdentifiers?.[0]?.identifier;
          if (!result.publishedYear) result.publishedYear = yearFromString(item.publishedDate);
        }
      }
    } catch { /* ignore fallback errors */ }
  }

  return result;
}

// ─── Online Catalog Search Helpers ──────────────────────────────────────────

async function searchGoogleBooks(query: string): Promise<BookMeta[]> {
  try {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=8`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return [];
    const data = await res.json() as any;
    if (!data.items || !Array.isArray(data.items)) return [];
    return data.items.map((item: any) => {
      const info = item.volumeInfo || {};
      const isbnObj = info.industryIdentifiers?.find((x: any) => x.type === "ISBN_13") || info.industryIdentifiers?.[0];
      return {
        title: decodeHtmlEntities(info.title) || "Untitled Book",
        author: info.authors?.join(", ") || "Unknown Author",
        description: decodeHtmlEntities((info.description || "").replace(/<[^>]+>/g, "").trim()) || "No description available.",
        coverUrl: info.imageLinks?.thumbnail?.replace("http:", "https:") || info.imageLinks?.smallThumbnail?.replace("http:", "https:") || null,
        isbn: isbnObj?.identifier || null,
        publishedYear: yearFromString(info.publishedDate) || null,
        category: info.categories?.[0] || "Technology",
        fileUrl: info.canonicalVolumeLink || info.infoLink || null,
      };
    });
  } catch {
    return [];
  }
}

async function searchOpenLibrary(query: string): Promise<BookMeta[]> {
  try {
    const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const data = await res.json() as any;
    if (!data.docs || !Array.isArray(data.docs)) return [];
    return data.docs.map((doc: any) => {
      const coverUrl = doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : null;
      return {
        title: decodeHtmlEntities(doc.title) || "Untitled Book",
        author: doc.author_name?.join(", ") || "Unknown Author",
        description: decodeHtmlEntities(doc.first_sentence?.[0] || (doc.subtitle ? `${doc.title}: ${doc.subtitle}` : `Published book reference by ${doc.author_name?.[0] || 'author'}.`)),
        coverUrl,
        isbn: doc.isbn?.[0] || null,
        publishedYear: doc.first_publish_year || (doc.publish_year?.[0] ? Number(doc.publish_year[0]) : null),
        category: doc.subject?.[0] || "Technology",
        fileUrl: doc.key ? `https://openlibrary.org${doc.key}` : null,
      };
    });
  } catch {
    return [];
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /books/import-url — Import book metadata from any web link
router.post("/books/import-url", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  const { url } = req.body as { url?: string };
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "url is required" });
  }

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  try {
    let meta: BookMeta = {};

    if (parsed.hostname.includes("books.google.com") || parsed.hostname.includes("play.google.com")) {
      meta = await fromGoogleBooks(url);
    } else if (parsed.hostname.includes("openlibrary.org")) {
      meta = await fromOpenLibrary(url);
    } else {
      meta = await fromGenericUrl(url);
    }

    // Clean null/undefined values
    const clean = Object.fromEntries(Object.entries(meta).filter(([, v]) => v !== undefined && v !== null && v !== ""));
    return res.json(clean);
  } catch (err: any) {
    req.log?.warn?.({ err: err.message, url }, "Failed to import book from URL");
    return res.status(422).json({ error: err.message || "Could not extract book data from that URL" });
  }
});

// GET /books/search-external — Search online book catalog (Multi-source: Google Books + Open Library fallback)
router.get("/books/search-external", requireAuth, async (req, res) => {
  const query = (req.query.query || req.query.q || "") as string;
  if (!query.trim()) {
    return res.json([]);
  }

  try {
    // 1. Try Google Books API first
    let results = await searchGoogleBooks(query.trim());

    // 2. If Google Books fails (quota limit / timeout / 0 results), fallback to Open Library API
    if (results.length === 0) {
      results = await searchOpenLibrary(query.trim());
    }

    return res.json(results);
  } catch (err: any) {
    req.log?.warn?.({ err: err.message, query }, "Failed external book search");
    return res.json([]);
  }
});

export default router;
