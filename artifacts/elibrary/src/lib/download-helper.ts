export interface DownloadedBook {
  id: number;
  title: string;
  author: string;
  coverUrl?: string | null;
  category: string;
  campus: string;
  downloadedAt: string;
}

/**
 * Saves a book's metadata to the local list of downloaded books.
 */
export function saveDownloadedBook(book: {
  id: number;
  title: string;
  author: string;
  coverUrl?: string | null;
  category: string;
  campus: string;
}) {
  try {
    const raw = localStorage.getItem("downloaded_books");
    const list: DownloadedBook[] = raw ? JSON.parse(raw) : [];
    if (!list.some(item => item.id === book.id)) {
      list.push({
        ...book,
        downloadedAt: new Date().toISOString(),
      });
      localStorage.setItem("downloaded_books", JSON.stringify(list));
    }
  } catch (e) {
    console.error("Failed to save downloaded book", e);
  }
}

/**
 * Retrieves the list of downloaded books from localStorage.
 */
export function getDownloadedBooks(): DownloadedBook[] {
  try {
    const raw = localStorage.getItem("downloaded_books");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Removes a book from the local list of downloaded books.
 */
export function removeDownloadedBook(id: number) {
  try {
    const raw = localStorage.getItem("downloaded_books");
    if (!raw) return;
    const list: DownloadedBook[] = JSON.parse(raw);
    const filtered = list.filter(item => item.id !== id);
    localStorage.setItem("downloaded_books", JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to remove downloaded book", e);
  }
}

/**
 * Triggers a browser file download of the book's content (or synthesizes one if content is empty)
 * and registers the book in the local downloaded list.
 */
export function triggerBookDownload(book: {
  id: number;
  title: string;
  author: string;
  coverUrl?: string | null;
  category: string;
  campus: string;
  content?: string | null;
  description?: string | null;
  fileUrl?: string | null;
  isbn?: string | null;
  publishedYear?: number | null;
}) {
  if (book.fileUrl) {
    // Attempt to fetch and download the original file directly
    fetch(book.fileUrl)
      .then(response => {
        if (!response.ok) throw new Error("Network response was not ok");
        return response.blob();
      })
      .then(blob => {
        // Create an object URL from the blob
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        
        // Extract filename from URL or fallback to book title
        let filename = book.fileUrl?.split('/').pop();
        if (!filename || filename.indexOf('.') === -1) {
          filename = `${book.title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
        }
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error("Direct download failed, falling back to opening in new tab:", error);
        window.open(book.fileUrl as string, "_blank", "noopener,noreferrer");
      });
  } else {
    const mainContent = book.content || (
      `# ${book.title}\n` +
      `## Introduction\n${book.description || "No description available."}\n\n` +
      `## Chapter 1: Overview\n` +
      `This is the digital preview version of "${book.title}" by ${book.author}. ` +
      `In this chapter, we explore the primary concepts and background context of ${book.category || "this subject"}. ` +
      `The library system allows registered users to access physical and digital media across all ZDSPGC campuses.\n\n` +
      `## Chapter 2: Detailed Analysis\n` +
      `Students and faculty members can read, save to reading lists, and request copies of resources. ` +
      `For physical checkouts, please refer to the "Borrowed Books" tab in the navigation menu to monitor return schedules, dates, and library details. ` +
      `Always check copy availability at your campus before reserving.\n\n` +
      `## Chapter 3: Key Takeaways\n` +
      `This digital copy is cached locally on your device for offline reading support. ` +
      `You can read this even if your connection is lost. Make sure to download or save it to your reading list for quick access later.`
    );

    const docText = [
      book.title,
      `by ${book.author}`,
      book.isbn ? `ISBN: ${book.isbn}` : "",
      book.publishedYear ? `Published: ${book.publishedYear}` : "",
      "",
      "─".repeat(60),
      "",
      mainContent,
    ].filter(Boolean).join("\n");

    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF();
      
      const margin = 15;
      const pageWidth = doc.internal.pageSize.width;
      const maxLineWidth = pageWidth - margin * 2;
      
      // Title
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      const titleLines = doc.splitTextToSize(book.title, maxLineWidth);
      let y = margin + 10;
      doc.text(titleLines, margin, y);
      y += titleLines.length * 10;
      
      // Author and Meta
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`by ${book.author}`, margin, y);
      y += 8;
      
      if (book.isbn) {
        doc.text(`ISBN: ${book.isbn}`, margin, y);
        y += 6;
      }
      if (book.publishedYear) {
        doc.text(`Published: ${book.publishedYear}`, margin, y);
        y += 6;
      }
      
      y += 5;
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
      
      // Content
      doc.setFontSize(11);
      
      const contentLines = doc.splitTextToSize(mainContent, maxLineWidth);
      
      for (let i = 0; i < contentLines.length; i++) {
        if (y > doc.internal.pageSize.height - margin) {
          doc.addPage();
          y = margin + 10;
        }
        doc.text(contentLines[i], margin, y);
        y += 6;
      }
      
      doc.save(`${book.title.replace(/[^a-z0-9]/gi, "_")}.pdf`);
    }).catch(err => {
      console.error("Failed to load jsPDF", err);
      // Fallback to text
      const blob = new Blob([docText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${book.title.replace(/[^a-z0-9]/gi, "_")}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }

  // Save download metadata to local storage
  saveDownloadedBook({
    id: book.id,
    title: book.title,
    author: book.author,
    coverUrl: book.coverUrl,
    category: book.category,
    campus: book.campus,
  });
}
