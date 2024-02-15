import { FieldPredicate } from "vega-lite/src/predicate";
import { OlliNode, OlliGroupNode, OlliPredicateNode, OlliAnnotationNode } from "../Structure/Types";
import { parse } from 'jsonc-parser';
import { llmBin } from "./llm";
import { OlliSpec, UnitOlliSpec } from "../Types";

interface Bin {
    bin_name: string;
    reasoning: string;
    pred: FieldPredicate[];
}

interface BinsContainer {
    subsets: Bin[];
}

export async function bin(spec: OlliSpec): Promise<OlliNode[]> {

    const extractDataBasedOnFields = (data, fields) => {
        return data.map(item => {
            let extracted = {};
            fields.forEach(field => {
                extracted[field.field] = item[field.field];
            });
            return extracted;
        });
    };
    console.log(spec.data)
    const extractedData = extractDataBasedOnFields(spec.data, spec.fields);
    console.log(extractedData);
    const response = await llmBin(extractedData);
    console.log(response);

    if (response !== ''){
        const data = extractAndParseJSON(response);
        // Create the OlliAnnotationNodes from the data
        const annotationNodes = createAnnotationNodesFromBins(data.bins);
        return annotationNodes
    }
}


export function createAnnotationNodesFromBins(bins: Bin[]): OlliAnnotationNode[] {
    return bins.map(bin => {
        // Create a OlliPredicateNode for each predicate in the bin
        const predicateNodes: OlliPredicateNode[] = bin.pred.map(pred => ({
            predicate: pred,
            children: [] // Assuming no children for simplicity
        }));
        
        // Wrap the predicate nodes in an OlliAnnotationNode
        return {
            annotations: predicateNodes,
            name: bin.bin_name
        };
    });
}

export function extractAndParseJSON(text: string) {

    // Find the index of the first opening brace
    const startIndex = text.indexOf('{');
    if (startIndex === -1) {
        throw new Error("No JSON object found in the string");
    }

    let openBraces = 0;
    let endIndex = startIndex;

    // Iterate through the string to find the matching closing brace
    for (let i = startIndex; i < text.length; i++) {
        if (text[i] === '{') {
            openBraces++;
        } else if (text[i] === '}') {
            openBraces--;
            if (openBraces === 0) {
                endIndex = i;
                break;
            }
        }
    }

    if (openBraces !== 0) {
        throw new Error("Invalid JSON object");
    }

    // Extract the JSON string
    const jsonString = text.substring(startIndex, endIndex + 1);

    // Parse and return the JSON object
    try {
        return parse(jsonString);
    } catch (error) {
        throw new Error("Invalid JSON format");
    }
}
