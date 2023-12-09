import { uploadPDF, displayPDF, navigateToPage, zoomIn, zoomOut, highlightText, addComment, insertPage, deletePage, reorderPages, trackChanges, getVersionHistory } from './utils/pdfUtils.js';

export function initializePDFLibrary() {
    const pdfContainer = document.getElementById('pdfContainer');

    // Create input element for browsing PDF files
    const fileInput = document.createElement('input');
    fileInput.type = 'file';

    // Create canvas element for displaying the PDF
    const canvas = document.createElement('canvas');
    canvas.id = 'pdfCanvas';

    // Create navigation buttons
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous Page';
    prevButton.addEventListener('click', handlePrevPage);

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next Page';
    nextButton.addEventListener('click', handleNextPage);

    // Append components to the pdfContainer
    pdfContainer.appendChild(fileInput);
    pdfContainer.appendChild(canvas);
    pdfContainer.appendChild(prevButton);
    pdfContainer.appendChild(nextButton);

    // Handle file input change event
    fileInput.addEventListener('change', handleFileInputChange);
}

function handleFileInputChange(event) {
    const file = event.target.files[0];
    // Load and display the PDF file
    displayPDF(file);
}

export function handleNavigation(pageNumber) {
    navigateToPage(pageNumber);
}

export function handleZoomIn() {
    zoomIn();
}

export function handleZoomOut() {
    zoomOut();
}

export function handleHighlight(text) {
    highlightText(text);
}

export function handleAddComment(comment) {
    addComment(comment);
}

export function handleInsertPage(pageNumber, content) {
    insertPage(pageNumber, content);
}

export function handleDeletePage(pageNumber) {
    deletePage(pageNumber);
}

export function handleReorderPages(pageOrder) {
    reorderPages(pageOrder);
}

export function handleTrackChanges() {
    trackChanges();
}

export function handleGetVersionHistory() {
    getVersionHistory();
}