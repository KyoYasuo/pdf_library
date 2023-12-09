export const renderPage = async (pdf, pageNumber) => {
    const page = await pdf.getPage(pageNumber);

    const container = document.getElementById('pdf-container');
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    const viewport = page.getViewport({ scale: 1.0 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    page.render({
        canvasContext: canvas.getContext('2d'),
        viewport: viewport,
    });
};