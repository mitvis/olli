# Olli - Making Visualizations more Accessible

Olli is a library, that in a single function call, creates a scalable and standard infrastructure for acessible web-based visualizations
by embedding a navigable tree that users can explore for a richer screen reader experience. Adapters specific
to different visualization libaries break down a chart where an accessible rendering is then created using existing
[ARIA TreeView](https://www.w3.org/wiki/TreeView) technology. 

<!-- Below is an example with a Vega-Lite visualization:
<div align="center">
  <div id="Vis"></div>
  <div id="Tree"></div>
  <script>
    let spec = {
              "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
              "name": "trellis_barley",
              "description": "A trellis of Barley yields from the 1930s, complete with main-effects ordering to facilitate comparison.",
              "data": {"url": "https://raw.githubusercontent.com/vega/vega-datasets/next/data/barley.json"},
              "mark": "point",
              "height": {"step": 12},
              "encoding": {
                "facet": {
                  "field": "site",
                  "type": "ordinal",
                  "columns": 2,
                  "sort": {"op": "median", "field": "yield"}
                },
                "x": {
                  "field": "yield",
                  "type": "quantitative",
                  "scale": {"zero": false}
                },
                "y": {
                  "field": "variety",
                  "type": "ordinal",
                  "sort": "-x"
                },
                "color": {"field": "year", "type": "nominal"}
              }
            }
     let vgSpec = vegaLite.compile(spec).spec
     const runtime = vega.parse(vgSpec);
     const render = document.getElementById('Vis');
     let view = new vega.View(runtime)
              .logLevel(vega.Warn)
              .initialize(render)
              .renderer('canvas') // Render as an image to not pollute DOM with elements that the screen reader needs to traverse first.
              .hover()
              .runAsync()
              .then(val => {
                window.createAccessibilityTree({
                  adapter: "vega-lite",
                  renderType: "tree",
                  domId: "Tree",
                  visObject: val,
                  visSpec: specArray[specIndex] })
                });
  </script>
</div> -->

## Current Visualization Library Support

* [Vega](https://vega.github.io/vega/)
* [Vega-Lite](https://vega.github.io/vega-lite)
* [ObservablePlot](https://observablehq.com/@observablehq/plot)

## How It Works

1. Using an adapter design pattern, visualizations are deconstructed into a `VisualizationStructure` type
   detailing a chart's structural, hierarchical, and visual components.
2. The deconstructed chart is then transformed into a tree following the design dimensions outlined in
   [this paper from EuroVis2022](http://vis.csail.mit.edu/pubs/rich-screen-reader-vis-experiences/)
3. The tree is then traversed to create various HTML Elements that are then appeneded to the webpage with set
   ARIA labels and key-bindings.

All of these steps are done by calling `olli({...})` in a single configuration containing the deconstructed
visualization, type of rendering to create, and the DOM Id of where to append the rendering.

## Usage

### HTML `<Script>` Tags

The most basic way to use Olli is to add it to any basic HTML page.

<details><summary><b>Show instructions</b></summary>

1. Add the script tag inside the document `<head>`:

    ```html
    <html>
      ...
      <head>
         ...
         <script src="..." />
         ...
      </head>
      ...
    </html>
    ```

2. Call Olli from a `<script>` tag:

    ```html
    ...
    <script>
      ...
      olli({
        visualization: vegaLiteAdapter(visSpec, additionalInfo),
        renderType: 'tree'
        domId: 'Accessible-Vis'
      })
    </script>
    ```

</details>

### JS Applications

Olli can also be easily added to normal JavaScript applications.

<details><summary><b>Show instructions</b></summary>

1. Install the preset:

    ```sh
    npm install olli
    ```

2. Import `olli`, and the adapter you want to use, into the file you want to use it in

    ```js
    import {olli, vegaLiteAdater} from 'olli'
    
    ...
    ```

3. Call `olli` and set-up your configuration object:

    ```js
    ...

      olli({
        visualization: vegaLiteAdapter(visSpec, additionalInfo),
        renderType: 'tree'
        domId: 'Accessible-Vis'
      })
    ...   
    ```

</details>

### React

Olli can even be used with React, but due to how React handles the state of the DOM, `olli` has to be called
inside the `useEffect(() => {}) hook.

<details><summary><b>Show instructions</b></summary>

1. Install preset:

    ```sh
    npm install olli
    ```

2. Import `olli`, and the adapter you want to use, into the component you want to use it in

    ```js
    import {olli, vegaLiteAdater} from 'olli'
    
    ...
    ```

3. Call `olli` and set-up your configuration object inside the `useEffect(() => {})` hook:

    ```js
    ...

    useEffect(() => {
      olli({
        visualization: vegaLiteAdapter(visSpec, additionalInfo),
        renderType: 'tree'
        domId: 'Accessible-Vis'
      })
    })
    ...   
    ```

</details>

## Configuration Object

Size Limit has a [GitHub action] that comments and rejects pull requests based
on Size Limit output.

1. Install and configure Size Limit as shown above.
2. Add the following action inside `.github/workflows/size-limit.yml`

```yaml
name: "size"
on:
  pull_request:
    branches:
      - master
jobs:
  size:
    runs-on: ubuntu-latest
    env:
      CI_JOB_NUMBER: 1
    steps:
      - uses: actions/checkout@v1
      - uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Contributing

If you want to help with Olli's development and want to see visualizations become more accessible,
anyone is welcome to clone the repository and fix bugs or add new features

```sh
git clone https:...
cd olli
git branch [Your Branch Name]
git checkout Your Branch Name]
```

### Adding New Adapters

There's a non-zero chance that an adapter may not exist yet for your visualization library, but that's ok!
There's a simple interface outlined for adapters where you can either create your own, or submit an issue to
add support for your library.

The adapter interface is as follows:

```js

export type VisAdapter = (visObject: any, helperVisInformation: any) => VisualizationStructure

```

For an explanation on the types that exist for Olli and how visualizations are decontructed check out the
README under `.\src\Adapters\`
