const path = require('path');

module.exports = {
    mode: 'production',
    entry: './index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'my-library.js',
        library: 'MyLibrary',
        libraryTarget: 'umd',
    },
    externals: {
        'pdfjs-dist': 'pdfjs-dist',
        // Add any other external dependencies here
    },
};