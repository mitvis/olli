# Olli - Screen Reader Accessibility for Data Visualization

Olli is an open-source library for converting data visualizations into accessible text structures for screen reader users. Starting with an existing visualization specification created with a supported toolkit, Olli produces a keyboard-navigable tree view with descriptions at varying levels of detail. Users can explore these structures both to get an initial overview, and to dive into the data in more detail. 

For a user tutorial, quickstart guide, and examples, see the [Olli website](https://mitvis.github.io/olli/).

## Development instructions

- Fork and clone the `mitvis/olli` repository.
- In the `olli` directory, run `npm install` to install dependencies for all packages. We use [npm workspaces](https://docs.npmjs.com/cli/v8/using-npm/workspaces) to manage the two packages in this repo.
- Run `npm run start` to start the webpack bundler in development mode with live reloading. Run `npm run build` to run webpack for production. (Note: `olli` must be built before `olli-adapters` the first time you run the build scripts.)

## Current Visualization Library Support

- [Vega](https://vega.github.io/vega/)
- [Vega-Lite](https://vega.github.io/vega-lite)
- [ObservablePlot](https://observablehq.com/@observablehq/plot)

## Related Links

- [Making data visualization more accessible for blind and low-vision individuals | MIT News](https://news.mit.edu/2022/data-visualization-accessible-blind-0602)
- [Rich Screen Reader Experiences for Accessible Data Visualization | MIT Visualization Group](http://vis.csail.mit.edu/pubs/rich-screen-reader-vis-experiences/)

## Contributions, Development, and Support

Interested in contributing to Olli? Please see our [contribution and development guidelines](https://github.com/mitvis/olli/blob/main/CONTRIBUTING.md), and our [code of conduct](https://vega.github.io/vega/about/code-of-conduct/).

Olli was originally created by [Matt Blanco](https://mattblanco.me/) and the library is maintained by the [MIT Visualization Group](http://vis.csail.mit.edu/).
