import { uploadPDF, displayPDF, navigateToPage, zoomIn, zoomOut, highlightText, addComment, insertPage, deletePage, reorderPages, trackChanges, getVersionHistory } from './utils/pdfUtils.js';

export function initializePDFLibrary() {
    const pdfContainer = document.getElementById('pdfContainer');

    // Create input element for browsing PDF files
    const fileInput = document.createElement('input');
    fileInput.type = 'file';

    // const canvas = document.createElement('canvas');
    // canvas.id = 'pdfCanvas';

    pdfContainer.appendChild(fileInput);

    fileInput.addEventListener('change', handleFileInputChange);
}

function handleFileInputChange(event) {
    const file = event.target.files[0];
    displayPDF(file);
}
