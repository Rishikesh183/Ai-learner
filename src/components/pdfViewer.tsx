import { useState, FC, useEffect } from 'react';

interface PDFViewerProps {
  content?: string;
  generatePDF: () => void;
}

const PDFViewer: FC<PDFViewerProps> = ({ content = '', generatePDF }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pages, setPages] = useState<string[]>([]);

  // Characters per page (adjust based on your font size and container size)
  const CHARS_PER_PAGE = 1500;

  // Split content into pages
  useEffect(() => {
    const contentText = content || '';

    // Function to split text into pages
    const paginateContent = (text: string): string[] => {
      // If content is empty, return a single empty page
      if (!text.trim()) return [''];

      const result: string[] = [];
      let currentPos = 0;

      while (currentPos < text.length) {
        // Find a good break point (preferably at paragraph or sentence end)
        let endPos = Math.min(currentPos + CHARS_PER_PAGE, text.length);

        // If we're not at the end, try to find a good break point
        if (endPos < text.length) {
          // Look for paragraph breaks first
          const paragraphBreak = text.lastIndexOf('\n\n', endPos);
          if (paragraphBreak > currentPos && paragraphBreak > endPos - 500) {
            endPos = paragraphBreak + 2; // Include the paragraph break
          } else {
            // Look for sentence breaks
            const sentenceBreak = Math.max(
              text.lastIndexOf('. ', endPos),
              text.lastIndexOf('! ', endPos),
              text.lastIndexOf('? ', endPos),
              text.lastIndexOf('.\n', endPos),
              text.lastIndexOf('!\n', endPos),
              text.lastIndexOf('?\n', endPos)
            );

            if (sentenceBreak > currentPos && sentenceBreak > endPos - 300) {
              endPos = sentenceBreak + 2; // Include the period and space
            } else {
              // As a last resort, look for a space
              const spaceBreak = text.lastIndexOf(' ', endPos);
              if (spaceBreak > currentPos) {
                endPos = spaceBreak + 1; // Include the space
              }
            }
          }
        }

        // Add the page
        result.push(text.substring(currentPos, endPos));
        currentPos = endPos;
      }

      return result;
    };

    setPages(paginateContent(contentText));
    setCurrentPage(1); // Reset to first page when content changes
  }, [content]);

  const totalPages = Math.max(1, pages.length);

  const nextPage = (): void => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = (): void => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  return (
    <div className="mt-8 flex flex-col items-center">
      <h2 className="text-2xl font-semibold mb-4">Generated Study Material</h2>

      {/* PDF-like container */}
      <div className="w-[30vw] h-[35vh] max-w-3xl shadow-lg overflow-hidden">
        {/* PDF header */}
        <div className="bg-gray-200 p-3 flex justify-between items-center border-b border-gray-300">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600 mr-2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <span className="font-medium">Study Material.pdf</span>
          </div>
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
        </div>

        {/* PDF content */}
        <div className="bg-white relative">
          {/* Paper texture overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white opacity-50 pointer-events-none"></div>

          {/* Actual content */}
          <div className="p-8 min-h-[70vh] max-h-[70vh] overflow-hidden relative">
            <div className="whitespace-pre-line text-gray-800 font-serif leading-relaxed">
              {pages[currentPage - 1] || ''}
            </div>

            {/* Page number watermark */}
            <div className="absolute bottom-2 right-4 text-gray-300 text-sm">
              {currentPage}
            </div>
          </div>

          {/* Page shadow effect */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-100 to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-gray-100 to-transparent pointer-events-none"></div>
        </div>

        {/* PDF footer */}
      </div>
      <div className="bg-gray-200 w-[30vw] p-3 flex justify-between items-center border-t border-gray-300">
        <div className="flex space-x-2">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className={`p-1 rounded ${currentPage === 1 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className={`p-1 rounded ${currentPage === totalPages ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-300'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
        <div className="flex-1 mx-4">
          <input
            type="range"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => setCurrentPage(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="flex space-x-1">
          <span className="text-sm">{currentPage}/{totalPages}</span>
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={generatePDF}
        className="mt-6 flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Download PDF
      </button>
    </div>
  );
};

export default PDFViewer;