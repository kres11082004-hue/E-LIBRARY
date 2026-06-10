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

function extractMeta(html: string, name: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i"),
    new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
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
        if (item["@type"] === "Book" || item["@type"] === "AudioBook") {
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

// ─── Google Books ─────────────────────────────────────────────────────────────
async function fromGoogleBooks(url: string): Promise<BookMeta> {
  // Extract volume ID from URL like books.google.com/books?id=XXXXX or /books/XXXXX
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
        title: info.title,
        author: info.authors?.join(", "),
        description: (info.description || "").replace(/<[^>]+>/g, "").trim(),
        coverUrl: info.imageLinks?.thumbnail?.replace("http:", "https:"),
        isbn: info.industryIdentifiers?.find((x: any) => x.type === "ISBN_13")?.identifier,
        publishedYear: yearFromString(info.publishedDate),
        category: info.categories?.[0],
        fileUrl: info.canonicalVolumeLink || info.infoLink,
      };
    }
  }

  // Also try search by URL as fallback
  return {};
}

// ─── Open Library ─────────────────────────────────────────────────────────────
async function fromOpenLibrary(url: string): Promise<BookMeta> {
  // e.g. https://openlibrary.org/books/OL7353617M/...
  const key = url.match(/\/(OL\w+)/)?.[1];
  if (!key) return {};

  const apiUrl = `https://openlibrary.org/books/${key}.json`;
  const res = await fetch(apiUrl, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return {};

  const data = await res.json() as any;
  const result: BookMeta = {
    title: data.title,
    description: typeof data.description === "string" ? data.description : data.description?.value,
    publishedYear: yearFromString(data.publish_date),
    isbn: data.isbn_13?.[0] || data.isbn_10?.[0],
  };

  // Get author names
  if (data.authors?.length) {
    try {
      const authorRes = await fetch(`https://openlibrary.org${data.authors[0].key}.json`, { signal: AbortSignal.timeout(5000) });
      if (authorRes.ok) {
        const a = await authorRes.json() as any;
        result.author = a.name;
      }
    } catch { /* skip */ }
  }

  // Cover
  if (data.covers?.[0]) {
    result.coverUrl = `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`;
  }

  result.fileUrl = url;
  return result;
}

// ─── Generic HTML scrape ──────────────────────────────────────────────────────
async function fromGenericUrl(url: string): Promise<BookMeta> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ZDSPGCELibrary/1.0; +https://zdspgc.edu.ph)",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
  const html = await res.text();

  // JSON-LD first (most structured)
  const jsonLd = extractJsonLd(html);

  const result: BookMeta = {
    title: jsonLd.title || extractMeta(html, "og:title") || extractMeta(html, "title"),
    author: jsonLd.author || extractMeta(html, "book:author") || extractMeta(html, "author"),
    description: jsonLd.description || extractMeta(html, "og:description") || extractMeta(html, "description"),
    coverUrl: jsonLd.coverUrl || extractMeta(html, "og:image"),
    isbn: jsonLd.isbn || extractMeta(html, "books:isbn"),
    publishedYear: jsonLd.publishedYear || yearFromString(extractMeta(html, "book:release_date") || extractMeta(html, "datePublished")),
    category: jsonLd.category || extractMeta(html, "og:type"),
    fileUrl: url,
  };

  // Clean up og:type if it's just "book"
  if (result.category === "book" || result.category === "website") delete result.category;

  return result;
}

// ─── Route ────────────────────────────────────────────────────────────────────

router.post("/books/import-url", requireAuth, requireRole("admin", "librarian"), async (req, res) => {
  const { url } = req.body as { url?: string };
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "url is required" });
  }

  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
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

    // Strip null/undefined
    const clean = Object.fromEntries(Object.entries(meta).filter(([, v]) => v !== undefined && v !== null && v !== ""));

    return res.json(clean);
  } catch (err: any) {
    req.log.warn({ err: err.message, url }, "Failed to import book from URL");
    return res.status(422).json({ error: err.message || "Could not extract book data from that URL" });
  }
});

export default router;
