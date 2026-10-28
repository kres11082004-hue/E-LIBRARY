import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lazy-load pdfjs-dist to avoid blocking initial app load
async function loadPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  // Use the CDN worker so we don't need a build-time worker copy
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  return pdfjs;
}

interface PdfViewerProps {
  fileUrl: string;
  title?: string;
}

export function PdfViewer({ fileUrl, title }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  const [pdf, setPdf] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);

  // Load the PDF document once
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const pdfjs = await loadPdfJs();
        const doc = await pdfjs.getDocument({ url: fileUrl, withCredentials: false }).promise;
        if (cancelled) return;
        setPdf(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
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

  // Render the current page whenever pdf/page/scale changes
  const renderPage = useCallback(async () => {
    if (!pdf || !canvasRef.current) return;

    // Cancel any in-flight render
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
      renderTaskRef.current = null;
    }

    setRendering(true);
    try {
      const page = await pdf.getPage(currentPage);
      const deviceRatio = window.devicePixelRatio || 1;

      // Auto-fit to container width on first render / when scale resets
      const containerWidth = containerRef.current?.clientWidth || 360;
      const viewport = page.getViewport({ scale });
      const fitScale = containerWidth / viewport.width;
      const actualScale = scale === 1.0 ? fitScale : scale;
      const finalViewport = page.getViewport({ scale: actualScale });

      const canvas = canvasRef.current;
      canvas.width = finalViewport.width * deviceRatio;
      canvas.height = finalViewport.height * deviceRatio;
      canvas.style.width = `${finalViewport.width}px`;
      canvas.style.height = `${finalViewport.height}px`;

      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(deviceRatio, 0, 0, deviceRatio, 0, 0);

      const task = page.render({ canvasContext: ctx, viewport: finalViewport });
      renderTaskRef.current = task;
      await task.promise;
    } catch (err: any) {
      if (err?.name !== "RenderingCancelledException") {
        console.error("Render error:", err);
      }
    } finally {
      setRendering(false);
    }
  }, [pdf, currentPage, scale]);

  useEffect(() => { renderPage(); }, [renderPage]);

  const goTo = (n: number) => setCurrentPage(Math.max(1, Math.min(n, totalPages)));
  const zoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));

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
      {/* PDF toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-100 border-b flex-wrap">
        {/* Page nav */}
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => goTo(currentPage - 1)} disabled={currentPage <= 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs font-semibold px-2 bg-white border rounded h-8 flex items-center min-w-[72px] justify-center">
            {currentPage} / {totalPages}
          </span>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => goTo(currentPage + 1)} disabled={currentPage >= totalPages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={zoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs font-medium min-w-[44px] text-center">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={zoomIn} disabled={scale >= 3}>
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Download */}
        <a
          href={fileUrl}
          download={title || "document.pdf"}
          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          <Download className="w-3 h-3" /> Save
        </a>
      </div>

      {/* Canvas scroll area */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-200 flex justify-center py-4 px-2">
        <div className="relative">
          {rendering && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <canvas
            ref={canvasRef}
            className="shadow-xl rounded"
            style={{ display: "block", maxWidth: "100%" }}
          />
        </div>
      </div>

      {/* Mobile swipe hint */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-3 py-3 bg-gray-100 border-t sm:hidden">
          <Button size="sm" variant="outline" className="flex-1 max-w-[120px]" onClick={() => goTo(currentPage - 1)} disabled={currentPage <= 1}>
            ← Prev
          </Button>
          <Button size="sm" variant="outline" className="flex-1 max-w-[120px]" onClick={() => goTo(currentPage + 1)} disabled={currentPage >= totalPages}>
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}
