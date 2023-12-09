import PDFViewer from './components/PDFViewer';
import PDFUploader from './components/PDFUploader';

const appContainer = document.getElementById('app');

// Create PDFViewer instance
const pdfViewer = new PDFViewer();

// Create PDFUploader instance
const pdfUploader = new PDFUploader((pdfData) => {
    pdfViewer.loadPDF(pdfData);
});

// Render PDFViewer and PDFUploader
appContainer.appendChild(pdfViewer.render());
appContainer.appendChild(pdfUploader.render());