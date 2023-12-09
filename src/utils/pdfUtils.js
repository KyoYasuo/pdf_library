// pdfUtils.js

export function displayPDF(fileUrl, canvas) {

    const pdfContainer = document.getElementById('pdfContainer');

    const { pdfjsLib } = globalThis;

    // Set worker source path
    pdfjsLib.GlobalWorkerOptions.workerSrc = '../pdf.js/pdf.worker.mjs';

    // Load PDF document
    pdfjsLib.getDocument('https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pldi-09.pdf').promise.then(async function (pdf) {
        // Get the number of pages in the PDF
        const numPages = pdf.numPages;

        // Render all pages
        await renderAllPages().then(() => {
            for (let i = 1; i <= numPages; i++) {
                const id = "pdfCanvas" + i;
                const canvas = document.getElementById(id);
                pdfContainer.appendChild(canvas);
            }
        });

        function renderPage(pageNumber) {
            pdf.getPage(pageNumber).then(function (page) {
                console.log(pageNumber, 'Page loaded');

                var scale = 1.5;
                var viewport = page.getViewport({ scale: scale });

                // Prepare canvas using PDF page dimensions
                const canvas = document.createElement('canvas');
                canvas.id = `pdfCanvas${pageNumber}`;
                // pdfContainer.appendChild(canvas);
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
                    console.log(canvas.id, 'Page rendered');
                });
            });
        }

        async function renderAllPages() {
            for (let i = 1; i <= numPages; i++) {
                renderPage(i);
            }
        }
    }, function (reason) {
        // PDF loading error
        console.error(reason);
    });
}