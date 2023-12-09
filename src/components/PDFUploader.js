class PDFUploader {
    constructor(onFileUpload) {
        this.onFileUpload = onFileUpload;
    }

    handleFileUpload = (event) => {
        const file = event.target.files[0];

        const reader = new FileReader();
        reader.onload = () => {
            const pdfData = reader.result;
            this.onFileUpload(pdfData);
        };
        reader.readAsArrayBuffer(file);
    };

    render() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/pdf';
        input.addEventListener('change', this.handleFileUpload);

        const container = document.createElement('div');
        container.className = 'pdf-uploader';
        container.appendChild(input);

        return container;
    }
}

export default PDFUploader;