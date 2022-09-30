# olli

Olli is an open-source library for converting data visualizations into accessible text structures for screen reader users. Starting with an existing visualization specification created with a supported toolkit, Olli produces a keyboard-navigable tree view with descriptions at varying levels of detail. Users can explore these structures both to get an initial overview, and to dive into the data in more detail.

For more information about Olli, see the main project repo at https://github.com/mitvis/olli.

This is Olli's core package, published on `npm` as `olli`.

## Structure

The `src/Structure` folder constructs a tree structure from a given `OlliVisSpec`. This code also assigns descriptions to each node in the tree.

## Render

The `src/Render` folder includes screen-reader-friendly renderers for a tree view and a table.
