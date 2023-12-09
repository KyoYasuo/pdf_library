import { PDFDocumentProxy } from 'pdfjs-dist';

const rendering = {
    pdfDoc: null,
    currentPage: 1,

    async init() {
        // Load the PDF document
        const pdfUrl = './assets/pdf/next-handbook.pdf';
        this.pdfDoc = await PDFJS.getDocument(pdfUrl);

        // Render the initial page
        this.renderPage(this.currentPage);

        // Set up event listeners for navigation
        const prevButton = document.getElementById('prev-button');
        const nextButton = document.getElementById('next-button');
        const goButton = document.getElementById('go-button');
        prevButton.addEventListener('click', this.showPrevPage.bind(this));
        nextButton.addEventListener('click', this.showNextPage.bind(this));
        goButton.addEventListener('click', this.goToPage.bind(this));
    },

    async renderPage(pageNumber) {
        const pageContainer = document.getElementById('pdf-container');
        const page = await this.pdfDoc.getPage(pageNumber);

        // Configure the viewport for rendering
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        // Create a canvas element
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        pageContainer.appendChild(canvas);

        // Render the page content on the canvas
        const renderContext = {
            canvasContext: context,
            viewport,
        };
        await page.render(renderContext);
    },

    async showPrevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            await this.renderPage(this.currentPage);
        }
    },

    async showNextPage() {
        if (this.currentPage < this.pdfDoc.numPages) {
            this.currentPage++;
            await this.renderPage(this.currentPage);
        }
    },

    async goToPage() {
        const pageInput = document.getElementById('page-input');
        const pageNumber = parseInt(pageInput.value, 10);
        if (pageNumber >= 1 && pageNumber <= this.pdfDoc.numPages) {
            this.currentPage = pageNumber;
            await this.renderPage(this.currentPage);
        }
    },
};

export default rendering;