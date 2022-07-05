# Directory Structure

The codebase is broken into three subdirectories, one for each part of Olli, converting a visualization into the `OlliVisSpec`, Creating a `AccessibilityTreeNode` based off of the transformed visualization, and finally rendering the constructed tree.

## Adapters

All of the adapters live inside of this directory where each new adapter will have its own file.

## Tree

This is where the `AccessibilityTreeNode` is created based on a provided `OlliVisSpec`

## Render

All of the different rendering types from the TreeView to a simple data table reside here. Each rendering type generates the HTML elements that will be appeneded on the specified DOM element.
