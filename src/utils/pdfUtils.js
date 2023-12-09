// pdfUtils.js

export function displayPDF(fileUrl, canvas) {
    // Create a new PDFJS object
    const { pdfjsLib } = globalThis;

    // Set worker source path
    pdfjsLib.GlobalWorkerOptions.workerSrc = '../pdf.js/pdf.worker.mjs';

    // Load PDF document
    pdfjsLib.getDocument(fileUrl).promise.then(function (pdf) {
        // Get the number of pages in the PDF
        const numPages = pdf.numPages;

        // Render all pages
        renderAllPages();

        function renderPage(pageNumber) {
            pdf.getPage(pageNumber).then(function (page) {
                console.log('Page loaded');

                var scale = 1.5;
                var viewport = page.getViewport({ scale: scale });

                // Prepare canvas using PDF page dimensions
                var context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                // Render PDF page into canvas context
                var renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };
                var renderTask = page.render(renderContext);
                renderTask.promise.then(function () {
                    console.log('Page rendered');
                });
            });
        }

        function renderAllPages() {
            for (let i = 1; i <= numPages; i++) {
                renderPage(i);
            }
        }
    }, function (reason) {
        // PDF loading error
        console.error(reason);
    });
}