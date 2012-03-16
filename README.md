Life Star
=========

Yet another web server for the Lively Kernel. Runs on node 0.6.x

    nvm use 0.6.10 # or 11, or ...
    jake
    cd LivelyKernel/
    make install_partsbin
    cd ..
    node life_start.js

This is basically a jsDAV handler on the local file system hooked up to a few express.js routes. Somewhat hacky.

It seems to work and we may have the possibility to write our own routes, server-side tool support etc. without giving up the current DAV-based tools.