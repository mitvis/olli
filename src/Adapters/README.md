# Deconstructing Visualizations

The adapter pattern is at the core in the design of Olli, being used to deconstruct visualizations
into an `OlliVisSpec`. Since every visualization grammar contains its own
complexities, in order to make a wider set of visualizations accessible, adapters are used to create
a common type that can then be rendered into different accessible formats. Generating a
screen-reader accessible structure for multiple visualization libraries is streamlined as the
rendering no longer has to work with the concrete implementation of external libraries. The type
system is comprised of a primary `OlliVisSpec` describing the structure of a chart with
`Guide`s. The types bring out the perceived or hierarchical elements of a chart that are rarely
explicitly outlined in a specification.

## `OlliVisSpec`

The `OlliVisSpec` is the output of the adapters deconstructing a visualization from its original
specification into a more generalized format. A visualization will either be a composite view of
nested charts or simply be a single chart depending on the hierarchy of information. Each object
also contains a high-level description of the visualization and the data that being visualized.
Within a lone chart, the `OlliVisSpec` also outlines the structured elements of the chart
including axes and legend, but also visual information such as the mark being used and the title of
the chart, if any.

Specific type information may be found in `Types.ts`.

### `Guide`s

`Guide`s contain information on the structured elements of charts. The axes and legends of a visualization share many common attributes throughout visualization grammars, and Olli reflects those similarities.

The `Guide` type may also be found in `Types.ts`.