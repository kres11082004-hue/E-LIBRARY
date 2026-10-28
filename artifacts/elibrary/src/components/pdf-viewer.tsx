import { useState, useEffect, useRef, useCallback } from "react";
import { ZoomIn, ZoomOut, Download, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Load PDF.js lazily ────────────────────────────────────────────────────────
let pdfjsModule: any = null;
async function loadPdfJs() {
  if (pdfjsModule) return pdfjsModule;
  const pdfjs = await import("pdfjs-dist");
  // Use the bundled worker from pdfjs-dist (avoids CDN version mismatch)
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();
  pdfjsModule = pdfjs;
  return pdfjs;
}

interface PdfViewerProps {
  fileUrl: string;
  title?: string;
}

// ─── Single page: canvas + text layer ─────────────────────────────────────────
interface PageProps {
  pdf: any;
  pdfjs: any;
  pageNum: number;
  scale: number;
  containerWidth: number;
  onVisible: (n: number) => void;
}

function PdfPage({ pdf, pdfjs, pageNum, scale, containerWidth, onVisible }: PageProps) {
  const wrapRef      = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const renderRef    = useRef<{ cancel: () => void } | null>(null);
  const textLayerInstance = useRef<any>(null);
  const [inView, setInView] = useState(false);

  // ── Intersection observer: mark visible + trigger render ──
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            onVisible(pageNum);
          }
        }
      },
      { rootMargin: "600px 0px", threshold: 0.01 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [pageNum, onVisible]);

  // ── Render canvas + text layer when in view ──
  useEffect(() => {
    if (!inView || !pdf || !canvasRef.current || !textLayerRef.current) return;

    // Cancel previous render
    renderRef.current?.cancel();
    renderRef.current = null;
    // Cancel previous text layer
    if (textLayerInstance.current) {
      try { textLayerInstance.current.cancel(); } catch { /* ignore */ }
      textLayerInstance.current = null;
    }

    let cancelled = false;

    (async () => {
      try {
        const page = await pdf.getPage(pageNum);
        if (cancelled) return;

        const deviceRatio = window.devicePixelRatio || 1;
        const usableWidth = Math.max((containerWidth || 360) - 24, 100);
        const naturalVp   = page.getViewport({ scale: 1.0 });
        const fitScale    = usableWidth / naturalVp.width;
        const actualScale = fitScale * scale;
        const vp          = page.getViewport({ scale: actualScale });

        // ── Canvas ──────────────────────────────────────────────
        const canvas = canvasRef.current!;
        canvas.width  = Math.floor(vp.width  * deviceRatio);
        canvas.height = Math.floor(vp.height * deviceRatio);
        canvas.style.width  = `${vp.width}px`;
        canvas.style.height = `${vp.height}px`;

        const ctx = canvas.getContext("2d")!;
        ctx.setTransform(deviceRatio, 0, 0, deviceRatio, 0, 0);

        const renderTask = page.render({ canvasContext: ctx, viewport: vp });
        renderRef.current = renderTask;
        await renderTask.promise;
        if (cancelled) return;

        // ── Text layer (pdfjs-dist v6 API) ──────────────────────
        const textLayer = textLayerRef.current!;
        textLayer.innerHTML = "";
        textLayer.style.width  = `${vp.width}px`;
        textLayer.style.height = `${vp.height}px`;

        // pdfjs-dist v6 uses a TextLayer class
        if (pdfjs.TextLayer) {
          const tl = new pdfjs.TextLayer({
            textContentSource: page.streamTextContent({ includeMarkedContent: true }),
            container: textLayer,
            viewport: vp,
          });
          textLayerInstance.current = tl;
          await tl.render();
        } else if (pdfjs.renderTextLayer) {
          // Fallback for older pdfjs builds
          const textContent = await page.getTextContent();
          if (cancelled) return;
          pdfjs.renderTextLayer({
            textContentSource: textContent,
            container: textLayer,
            viewport: vp,
            textDivs: [],
          });
        }
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException" && err?.name !== "AbortException") {
          console.error(`Page ${pageNum} render error:`, err);
        }
      }
    })();

    return () => {
      cancelled = true;
      renderRef.current?.cancel();
      renderRef.current = null;
      if (textLayerInstance.current) {
        try { textLayerInstance.current.cancel(); } catch { /* ignore */ }
        textLayerInstance.current = null;
      }
    };
  }, [inView, pdf, pdfjs, pageNum, scale, containerWidth]);

  return (
    <div
      ref={wrapRef}
      data-page={pageNum}
      className="flex justify-center mb-3"
    >
      {/* Wrapper keeps canvas + text layer stacked */}
      <div className="relative shadow-xl rounded overflow-hidden bg-white"
           style={{ display: "inline-block", maxWidth: "100%" }}>
        <canvas
          ref={canvasRef}
          style={{ display: "block", maxWidth: "100%" }}
        />
        {/* Text layer sits over canvas — transparent but selectable */}
        <div
          ref={textLayerRef}
          className="pdf-text-layer"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "auto",
            userSelect: "text",
            WebkitUserSelect: "text",
            overflow: "hidden",
          }}
        />
      </div>
    </div>
  );
}

// ─── Main viewer ───────────────────────────────────────────────────────────────
export function PdfViewer({ fileUrl, title }: PdfViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [pdfjs, setPdfjs]               = useState<any>(null);
  const [pdf, setPdf]                   = useState<any>(null);
  const [totalPages, setTotalPages]     = useState(0);
  const [currentPage, setCurrentPage]   = useState(1);
  const [scale, setScale]               = useState(1.0);
  const [containerWidth, setContainerWidth] = useState(360);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);

  // Load PDF
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPdf(null);
    setTotalPages(0);
    setCurrentPage(1);

    (async () => {
      try {
        const lib = await loadPdfJs();
        if (cancelled) return;
        setPdfjs(lib);

        const doc = await lib.getDocument({ url: fileUrl, withCredentials: false }).promise;
        if (cancelled) return;
        setPdf(doc);
        setTotalPages(doc.numPages);
        setLoading(false);
      } catch (err: any) {
        if (!cancelled) {
          console.error("PDF load error:", err);
          setError("Failed to load PDF. " + (err?.message || ""));
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [fileUrl]);

  // Track container width for responsive scaling
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width || 360);
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth || 360);
    return () => ro.disconnect();
  }, [loading]);

  const handlePageVisible = useCallback((n: number) => setCurrentPage(n), []);

  const scrollToPage = (n: number) => {
    const clamped = Math.max(1, Math.min(n, totalPages));
    const el = scrollRef.current?.querySelector(`[data-page="${clamped}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    setCurrentPage(clamped);
  };

  const zoomIn    = () => setScale(s => Math.min(+(s + 0.25).toFixed(2), 3.0));
  const zoomOut   = () => setScale(s => Math.max(+(s - 0.25).toFixed(2), 0.25));
  const resetZoom = () => setScale(1.0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading PDF…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-4 py-20 px-6 text-center">
        <p className="text-red-500 font-semibold">Could not render PDF</p>
        <p className="text-xs text-muted-foreground">{error}</p>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90"
        >
          <Download className="w-4 h-4" /> Open / Download PDF
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 px-2 py-2 bg-gray-100 border-b shrink-0">
        {/* Page nav */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0"
            onClick={() => scrollToPage(currentPage - 1)} disabled={currentPage <= 1}>
            <ChevronUp className="w-4 h-4" />
          </Button>
          <span className="text-xs font-semibold px-1.5 bg-white border rounded h-8 flex items-center min-w-[64px] justify-center whitespace-nowrap">
            {currentPage} / {totalPages}
          </span>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0"
            onClick={() => scrollToPage(currentPage + 1)} disabled={currentPage >= totalPages}>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0"
            onClick={zoomOut} disabled={scale <= 0.25}>
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <button onClick={resetZoom}
            className="text-xs font-medium min-w-[40px] text-center hover:underline"
            title="Reset to fit width">
            {scale === 1.0 ? "Fit" : `${Math.round(scale * 100)}%`}
          </button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0"
            onClick={zoomIn} disabled={scale >= 3}>
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Download */}
        <a href={fileUrl} download={title || "document.pdf"}
          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90 shrink-0">
          <Download className="w-3 h-3" />
          <span className="hidden sm:inline">Save</span>
        </a>
      </div>

      {/* ── Continuous scroll ────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-300 px-2 pt-3 pb-4">
        {pdf && pdfjs && Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <PdfPage
            key={`${fileUrl}-p${n}`}
            pdf={pdf}
            pdfjs={pdfjs}
            pageNum={n}
            scale={scale}
            containerWidth={containerWidth}
            onVisible={handlePageVisible}
          />
        ))}
      </div>

      {/* ── Mobile bottom nav ────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-white border-t sm:hidden shrink-0">
          <Button size="sm" variant="outline" className="flex-1 h-10 text-sm font-semibold"
            onClick={() => scrollToPage(currentPage - 1)} disabled={currentPage <= 1}>
            <ChevronUp className="w-4 h-4 mr-1" /> Prev
          </Button>
          <span className="text-xs font-bold text-muted-foreground shrink-0">
            {currentPage} / {totalPages}
          </span>
          <Button size="sm" variant="outline" className="flex-1 h-10 text-sm font-semibold"
            onClick={() => scrollToPage(currentPage + 1)} disabled={currentPage >= totalPages}>
            Next <ChevronDown className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
