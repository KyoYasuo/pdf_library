# This is pdf editable reader.

## Getting the Code

To get a local copy of the current code, clone it using git:

    $ git clone https://github.com/Shapi1234/PDF-EDITOR.git
    $ cd PDF-EDITOR

If everything worked out, install all dependencies for PDF.js:

    $ npm install

Next, install Node.js via the [official package](https://nodejs.org) or via

    $ npm install gulp-cli

Finally, you need to start a local web server as some browsers do not allow opening
PDF files using a `file://` URL. Run:

    $ gulp server

and then you can open:

+ http://localhost:8888/web/viewer.html

It is also possible to view all test PDF files on the right side by opening:

+ http://localhost:8888/test/pdfs/?frame



