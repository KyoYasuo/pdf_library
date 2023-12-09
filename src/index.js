import { renderPDF } from './rendering';
import { navigatePages } from './navigation';
import { zoomIn, zoomOut } from './zoom';
import { highlightText } from './highlight';
import { addComment } from './comment';
import { insertPage, deletePage, reorderPages } from './pageManipulation';
import { trackChanges, versionControl } from './versionControl';

// Load the PDF document and render the initial page
const loadPDF = async (url) => {
    // Load the PDF document using pdf.js
    const pdf = await pdfjsLib.getDocument(url).promise;

    // Get the total number of pages in the PDF document
    const numPages = pdf.numPages;

    // Store the current page number
    let currentPage = 1;

    // Render the initial page
    renderPage(pdf, currentPage);

    // Add event listeners to previous and next buttons
    const prevButton = document.getElementById('prev-button');
    prevButton.addEventListener('click', () => goToPreviousPage(pdf, currentPage));

    const nextButton = document.getElementById('next-button');
    nextButton.addEventListener('click', () => goToNextPage(pdf, currentPage));
};
