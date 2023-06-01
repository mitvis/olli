import { OlliAxis, OlliLegend, OlliSpec } from '../Types';
import { typeInference } from '../util/types';
import { OlliNode } from './Types';

export function inferStructure(olliSpec: OlliSpec): OlliNode | OlliNode[] {
  function nodesFromGuides(axes: OlliAxis[], legends: OlliLegend[]): OlliNode[] {
    let nodes: OlliNode[] = [];
    if (axes) {
      nodes = nodes.concat(
        axes.map((axis) => {
          return { groupby: axis.field, children: [] };
        })
      );
    }
    if (legends) {
      nodes = nodes.concat(
        legends.map((legend) => {
          return { groupby: legend.field, children: [] };
        })
      );
    }
    return nodes;
  }

  if (olliSpec.facet && (olliSpec.axes || olliSpec.legends)) {
    return {
      groupby: olliSpec.facet,
      children: nodesFromGuides(olliSpec.axes, olliSpec.legends),
    };
  } else if (olliSpec.mark === 'line' && olliSpec.legends) {
    const colorLegend = olliSpec.legends.find((legend) => legend.channel === 'color');
    if (colorLegend) {
      // multi-series line
      return {
        groupby: colorLegend.field,
        children: nodesFromGuides(
          olliSpec.axes,
          olliSpec.legends.filter((legend) => legend !== colorLegend)
        ),
      };
    }
  } else if (olliSpec.axes || olliSpec.legends) {
    return nodesFromGuides(olliSpec.axes, olliSpec.legends);
  } else if (olliSpec.data.length) {
    // TODO can try inferences with data mtypes
    // otherwise, just give all fields flat
    const fields = Object.keys(olliSpec.data[0]);
    const fieldDefs = fields.map((field) => {
      return {
        field,
        type: typeInference(olliSpec.data, field),
      };
    });
    return fieldDefs.map((fieldDef) => {
      return {
        groupby: fieldDef,
        children: [],
      };
    });
  }
}
