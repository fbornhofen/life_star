Life Star
=========

Yet another web server for the Lively Kernel. Runs on node 0.6.x

    nvm use 0.6.10 # or 11, or ...
    # make sure libxml2-dev is installed
    # npm install jake (in case you haven't done that yet)
    jake
    cd LivelyKernel/
    make install_partsbin
    cd ..
    node life_start.js

Then open http://localhost:9001 in a WebKit based browser or Firefox.

This is basically a jsDAV handler on the local file system hooked up to a few express.js routes. Somewhat hacky.

It seems to work and we may have the possibility to write our own routes, server-side tool support etc. without giving up the current DAV-based tools.
