// pdfUtils.js

export function displayPDF(fileUrl, canvas) {
    // Create a new PDFJS object
    const pdfjsLib = window['pdfjs-dist/build/pdf'];

    // Set worker source path
    pdfjsLib.GlobalWorkerOptions.workerSrc = '../pdf.js/pdf.worker.js';

    // Load PDF document
    pdfjsLib.getDocument(fileUrl).promise.then(function (pdf) {
        // Get the number of pages in the PDF
        const numPages = pdf.numPages;

        // Set the initial page number
        let pageNumber = 1;

        // Render all pages
        renderAllPages();

        function renderPage(pageNumber) {
            // Fetch the specified page from the PDF
            pdf.getPage(pageNumber).then(function (page) {
                const viewport = page.getViewport({ scale: 1.0 });

                // Set the canvas dimensions based on the viewport
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                // Render the PDF page on the canvas
                page.render({ canvasContext: canvas.getContext('2d'), viewport: viewport });
            });
        }

        function renderAllPages() {
            for (let i = 1; i <= numPages; i++) {
                renderPage(i);
            }
        }
    });
}