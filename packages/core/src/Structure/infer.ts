import { OlliAxis, OlliGuide, OlliLegend, UnitOlliSpec } from '../Types';
import { getFieldDef } from '../util/data';
import { OlliNode } from './Types';

export function inferStructure(olliSpec: UnitOlliSpec): OlliNode | OlliNode[] {
  function nodesFromGuides(axes: OlliAxis[], legends: OlliLegend[], guides?: OlliGuide[]): OlliNode[] {
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
    if (guides) {
      nodes = nodes.concat(
        guides.map((guide) => {
          return { groupby: guide.field, children: [] };
        })
      );
    }
    // const otherFields = olliSpec.fields.filter((field) => {
    //   return (
    //     !axes?.find((axis) => axis.field === field.field) &&
    //     !legends?.find((legend) => legend.field === field.field) &&
    //     !(olliSpec.facet === field.field)
    //   );
    // });
    // if (otherFields.length) {
    //   nodes = nodes.concat(
    //     otherFields.map((field) => {
    //       return { groupby: field.field, children: [] };
    //     })
    //   );
    // }
    return nodes.filter((node, index, arr) => {
      if ('groupby' in node) {
        return arr.findIndex((n) => 'groupby' in n && n.groupby === node.groupby) === index;
      }
      return true;
    });
  }

  if (olliSpec.facet) {
    if (olliSpec.axes?.length || olliSpec.legends?.length) {
      return {
        groupby: olliSpec.facet,
        children: nodesFromGuides(olliSpec.axes, olliSpec.legends, olliSpec.guides),
      };
    } else {
      return {
        groupby: olliSpec.facet,
        children: olliSpec.fields
          .filter((f) => f.field !== olliSpec.facet)
          .map((f) => {
            return {
              groupby: f.field,
            };
          }),
      };
    }
  } else if (olliSpec.mark === 'line' && olliSpec.legends?.length) {
    const colorLegend = olliSpec.legends.find((legend) => legend.channel === 'color');
    if (colorLegend) {
      // multi-series line
      return {
        groupby: colorLegend.field,
        children: nodesFromGuides(
          olliSpec.axes,
          olliSpec.legends.filter((legend) => legend !== colorLegend),
          olliSpec.guides
        ),
      };
    }
  } else if (olliSpec.mark === 'bar') {
    if (olliSpec.axes?.length) {
      const quantAxis = olliSpec.axes?.find((axis) => {
        const fieldDef = getFieldDef(axis.field, olliSpec.fields);
        return fieldDef.type === 'quantitative' && !fieldDef.bin;
      });
      return nodesFromGuides(
        olliSpec.axes.filter((axis) => axis !== quantAxis),
        olliSpec.legends
      );
    } else {
      const quantField = olliSpec.fields.find((field) => field.type === 'quantitative');
      return olliSpec.fields
        .filter((field) => field !== quantField)
        .map((fieldDef) => {
          return {
            groupby: fieldDef.field,
            children: [],
          };
        });
    }
  } else if (olliSpec.axes?.length || olliSpec.legends?.length) {
    return nodesFromGuides(olliSpec.axes, olliSpec.legends);
  } else {
    // TODO can try inferences with data mtypes
    // otherwise, just give all fields flat
    return olliSpec.fields.map((fieldDef) => {
      return {
        groupby: fieldDef.field,
        children: [],
      };
    });
  }
}
