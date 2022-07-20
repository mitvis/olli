# Generating a Tree

With a chart generalized away from its concrete visualization library implementation it's easier to transform into more accessible renderings.
As mentioned in the root README, Olli's navigable tree view is based on prior design dimensions for [rich screen reader experiences for accessible data visualization](http://vis.csail.mit.edu/pubs/rich-screen-reader-vis-experiences/) from the [Visualization Group](http://vis.csail.mit.edu) at MIT.

## Three Design Dimensions

The dimensions are Structure, Navigation, and Description affording visually impaired users a more interactive data exploration experience at varying levels of granularity — from fine-grained datum-by-datum reading to skimming and surfacing high-level trends.

### 1. Structure

Structure is the underlying representation of a visualization that organizes its data and visual elements into a format that can be traversed by a screen reader. For Olli, this means understanding the axes, legends, faceted views, or concatenations that exist in a visualization and even the idividual data points that exist. Structure defines what nodes are present in the tree representation and what is explorable by a user.

### 2. Navigation

Navigation is how a user explores the tree. While sighted users have a whole to part understanding of a visualization, for visually impaired users it's the opposite where they have to construct a model of the chart based on indifivual data points. Due to this, users need different ways of wayfinding thoroughout a chart, and an ability to keep track of their location spatially in the chart.

### 3. Description

Description is the text of each node that the screen reader outputs to the user. Based on the context of the data it's the eventual goal of Olli to change description verbosity based on the users' needs for a more customizable experience, so they get the information they want.

## Rendering

Olli is rendered using existing accessibility technology such as Aria labels, [Aria TreeView](https://www.w3.org/wiki/TreeView), and HTML tables to easily incorporate into a user's current workflow and to be usable on all modern browsers.

## Key-Bindings

* `up & down` arrow keys: Traverse to adjacent nodes in the current layer
* `left & right` arrow keys: Traverse to new layers of the tree
* `Home`: Go to the root node of the tree
* `End`: Go to the bottom node of the current branch you're on
* `X`: Traverse to the nearest x-axis
* `Y`: Traverse to the nearest y-axis
* `L`: Traverse to the nearest legend