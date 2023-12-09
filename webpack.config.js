const path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/index.js',
    output: {
        filename: 'pdfLibrary.js',
        path: path.resolve(__dirname, 'dist'),
        library: 'pdfLibrary',
        libraryTarget: 'umd',
    },
};