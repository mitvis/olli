import { VisAdapter, UnitOlliSpec, OlliAxis, OlliLegend, OlliMark } from 'olli';

// Observable-Plot has no type declaration file :/
const Plot = require('@observablehq/plot');

/**
 * Observable-Plot does not have any exported types
 */
type ObservablePlotSpec = any;

/**
 * * Adapter to deconstruct ObservablePlot visualizations into an {@link OlliVisSpec}
 * @param plot The ObservablePlot spec to render the visualization
 * @returns the generated {@link OlliVisSpec}
 */
export const ObservablePlotAdapter: VisAdapter<ObservablePlotSpec> = async (
  plotObject: ObservablePlotSpec
): Promise<UnitOlliSpec> => {
  const plotSVG = await Plot.plot(plotObject);
  const description = plotObject.ariaDescription;
  return plotToOlliSpec(plotObject, plotSVG, description);
};

/**
 * Specifies that the provided visualization information relates to a faceted chart
 * @param plot The ObservablePlot spec to render the visualization
 * @param svg the rendered SVGElement of the visualization
 * @returns the generated {@link FacetedChart}
 */
function plotToOlliSpec(plot: any, svg: Element, description?: string): UnitOlliSpec {
  const chartSVG = svg.tagName !== 'svg' ? Object.values(svg.children).find((n) => n.tagName === 'svg')! : svg;
  const axes: OlliAxis[] = ['x-axis', 'y-axis'].reduce((parsedAxes: OlliAxis[], s: string) => {
    let axisSVG = findHtmlElement(chartSVG, s);
    if (axisSVG) {
      parsedAxes.push(parseAxis(plot, axisSVG));
    }
    return parsedAxes;
  }, []);
  let legends: OlliLegend[] = [];
  if (plot.color && plot.color.legend) legends.push(parseLegend(plot, svg.children[0]));

  const plotMark = plot.marks.filter((mark: any) => mark.ariaLabel !== 'rule')[0];

  let facetField;
  if (plot.facet) {
    facetField = plot.facet.y ? plot.facet.y : plot.facet.x;
  } else if (plotMark && plotMark.ariaLabel === 'line') {
    facetField = flatChannels(plot.marks.find((mark: any) => mark.ariaLabel === 'line').channels).find(
      (c: any) => c.name === 'stroke'
    )?.value;
  }

  return {
    data: plotMark.data,
    facet: facetField,
    mark: plotMarkToOlliMark(plotMark.ariaLabel),
    axes,
    legends,
    description,
  };
}

/**
 * Creates an {@link Axis} from the provided spec and svg
 * @param plot The ObservablePlot spec to render the visualization
 * @param svg the SVG element of an axis
 * @returns A {@link Axis} of the visualization
 */
function parseAxis(plot: any, svg: Element): OlliAxis {
  const axisType = svg?.getAttribute('aria-label') === 'y-axis' ? 'y' : 'x';
  const plotMark = plot.marks.filter((mark: any) => mark.ariaLabel !== 'rule')[0];
  const channel = flatChannels(plotMark.channels).find((c: any) => c.scale === axisType);
  const field: string = typeof channel.value === 'object' ? channel.value.label : channel.value;

  const guide: OlliAxis = {
    field: field,
    axisType: axisType,
  };

  if (channel.type) {
    guide.scaleType = channel.type;
  }

  return guide;
}

/**
 * Creates an {@link Legend} from the provided spec and svg
 * @param plot The ObservablePlot spec to render the visualization
 * @param svg the SVG element of an legend
 * @returns A {@link Legend} of the visualization
 */
function parseLegend(plot: any, svg: Element): OlliLegend {
  //TODO: Does not support 'ramp' legend types when the legend is rendered as an SVG
  const legendChannels = ['fill']; // TODO hardcoded list of channels
  const plotMark = plot.marks.filter((mark: any) => mark.ariaLabel !== 'rule')[0];
  const channel = flatChannels(plotMark.channels).find((c: any) => legendChannels.includes(c.name));
  const field: string = typeof channel.value === 'object' ? channel.value.label : channel.value;

  const guide: OlliLegend = {
    field: field,
    channel: channel.name,
  };

  return guide;
}

/**
 * Finds a specified HTML element from a provided string
 * @param svg the root HTML Element to begin the search
 * @param label the string of the HTML element to search for
 * @returns the found HTML Element or undefined if no element was found
 */
function findHtmlElement(svg: Element, label: string): Element | undefined {
  const attributeToCompare = 'aria-label';
  let returnedElement: Element | undefined;
  Object.keys(svg.children).forEach((k: string) => {
    let childElement: Element = svg.children[parseInt(k)];
    if (childElement.getAttribute(attributeToCompare) === label) {
      returnedElement = childElement;
    }
  });
  return returnedElement;
}

function plotMarkToOlliMark(m: string): OlliMark | undefined {
  switch (m) {
    case 'dot':
      return 'point';
    case 'bar':
      return 'bar';
    case 'line':
      return 'line';
    default:
      return undefined;
  }
}

function flatChannels(channels: any) {
  return channels.find ? channels : Object.entries(channels).map(([name, chan]) => ({ ...(chan as {}), name }));
}
