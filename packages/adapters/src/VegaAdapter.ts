import {
  Spec,
  ScaleDataRef,
  Scale,
  ScaleData,
  Scene,
  SceneItem,
  ScaleMultiFieldsRef,
  SceneGroup,
  SignalRef,
} from 'vega';
import { OlliSpec, VisAdapter, OlliMark, OlliDataset, OlliAxis, OlliLegend } from 'olli';
import { filterUniqueObjects, findScenegraphNodes, getData, getVegaScene, getVegaView } from './utils';

/**
 * Adapter function that breaks down a Vega visualization into it's basic visual grammar
 * @param spec The Vega Specification used to generate the visualization
 * @returns the {@link OlliVisSpec}, the non-concrete visualization information that can be later used to
 * generate the Accessibility Tree Encoding
 */
export const VegaAdapter: VisAdapter<Spec> = async (spec: Spec): Promise<OlliSpec> => {
  const scene: SceneGroup = getVegaScene(await getVegaView(spec));
  const data = getData(scene)[0];
  const description = spec.description; // possible text description included with spec
  if (scene.items.some((el: any) => el.role === 'scope')) {
    return { description, ...parseFacets(spec, scene, data) };
  } else {
    return { description, ...parseSingleChart(spec, scene, data) };
  }
};

function parseFacets(spec: Spec, scene: SceneGroup, data: OlliDataset): OlliSpec {
  const axes = filterUniqueObjects<OlliAxis>(
    findScenegraphNodes(scene, 'axis').map((axisNode: any) => parseAxisInformation(spec, axisNode, data))
  );
  const legends = filterUniqueObjects<OlliLegend>(
    findScenegraphNodes(scene, 'legend').map((legendNode: any) => parseLegendInformation(spec, legendNode, data))
  );
  let facetField: string;
  const facetMarkSpec = spec.marks?.find((m: any, i: number) => m.from && m.from.facet)! as any;

  const mark = vegaMarkToOlliMark(facetMarkSpec.marks[0].type);

  const facetDef = (facetMarkSpec.from! as any).facet.groupby;

  if (Array.isArray(facetDef)) {
    facetField = facetDef[0];
  } else {
    facetField = facetDef;
  }

  return {
    mark,
    data,
    axes,
    legends,
    facet: facetField,
  };
}

function parseSingleChart(spec: Spec, scene: Scene | SceneItem, data: OlliDataset): OlliSpec {
  const axes = findScenegraphNodes(scene, 'axis').map((axisNode: any) => parseAxisInformation(spec, axisNode, data));
  const legends = findScenegraphNodes(scene, 'legend').map((legendNode: any) =>
    parseLegendInformation(spec, legendNode, data)
  );
  const chartTitle: string | undefined =
    findScenegraphNodes(scene, 'title').length > 0
      ? findScenegraphNodes(scene, 'title')[0].items[0].items[0].items[0].text
      : undefined;

  const mark = vegaMarkToOlliMark(spec.marks?.map((mark) => mark.type)[0]); // TODO write a better way to get the mark type

  return {
    data,
    axes,
    legends,
    mark,
    title: chartTitle,
  };
}

function vegaMarkToOlliMark(mark?: string): OlliMark | undefined {
  switch (mark) {
    case 'symbol':
      return 'point';
    case 'line':
      return 'line';
    case 'rect':
      return 'bar';
    default:
      return undefined;
  }
}

/**
 * @returns a key-value pairing of the axis orientation and the {@link Guide} of the corresponding axis
 */
function parseAxisInformation(spec: Spec, axis: any, data: OlliDataset): OlliAxis {
  const axisView = axis.items[0];
  const title: string = axisView.items.find((n: any) => n.role === 'axis-title')?.items?.[0]?.text;
  const scaleName: string = axisView.datum.scale;
  const scaleSpec = spec.scales?.find((specScale: Scale) => specScale.name === scaleName)!;

  // TODO make finding the field more robust to different kinds of scale domain specs
  let scaleDomain: any = scaleSpec?.domain as ScaleData;

  if (!scaleDomain) {
    spec.marks?.forEach((m: any) => {
      const markScales: Scale[] = m.scales;
      if (markScales) {
        let s = markScales.find((specScale: Scale) => specScale.name === scaleName);
        if (s) scaleDomain = s.domain as ScaleData;
      }
    });
  }

  let field: string;
  if (scaleDomain?.field && !scaleDomain?.field?.signal) {
    field = (scaleDomain as ScaleDataRef).field as string;
  } else if (scaleDomain.data && scaleDomain.fields) {
    if (
      scaleDomain.fields.length === 2 &&
      (scaleDomain.fields[0] as string).endsWith('_start') &&
      (scaleDomain.fields[1] as string).endsWith('_end')
    ) {
      // stack transform for stacked bars
      const str = (scaleDomain as ScaleMultiFieldsRef).fields[0] as string;
      field = str.substring(0, str.indexOf('_start'));
    } else {
      // TODO think this case through
      field = scaleDomain.fields[0];
    }
  } else {
    // TODO
    field = scaleDomain.fields[0].field;
  }
  //

  const scaleType = scaleSpec?.type;
  const axisType = axisView.orient === 'bottom' || axisView.orient === 'top' ? 'x' : 'y';

  // convert temporal values into date objects
  if (scaleType === 'time') {
    data.forEach((datum) => {
      datum[field] = new Date(datum[field]);
    });
  }

  return {
    title: title,
    field: field,
    scaleType,
    axisType: axisType,
  };
}

/**
 * @returns a key-value pairing of the legend name and the {@link Guide} of the corresponding axis
 */
function parseLegendInformation(spec: Spec, legendNode: any, data: OlliDataset): OlliLegend {
  const scaleName: string = legendNode.items[0].datum.scales[Object.keys(legendNode.items[0].datum.scales)[0]];
  const scaleSpec = spec.scales?.find((specScale: any) => specScale.name === scaleName);
  const title: string = legendNode.items[0].items.find((n: any) => n.role === 'legend-title').items[0].text;

  let field: string | undefined;
  const legendDomain = scaleSpec?.domain;
  if ('field' in legendDomain) {
    if (!(legendDomain.field as SignalRef).signal) {
      field = legendDomain.field as string;
    }
  } else {
    if (Object.keys(data[0]).some((key: string) => key.toLocaleString() === title.toLocaleLowerCase())) {
      field = title.toLocaleLowerCase();
    }
  }

  return {
    channel: scaleName as any,
    title: title,
    field: field as string,
  };
}
