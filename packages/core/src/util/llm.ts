import OpenAI from 'openai';
import { OlliPredicateNode } from '../Structure/Types';
import { OlliDataset } from '../Types';
import { parse } from 'jsonc-parser';

const secrets = process.env.NODE_ENV === 'development' ? require('../secrets/openai.json') : {};
const openai = new OpenAI({
  apiKey: secrets['apiKey'],
  dangerouslyAllowBrowser: true,
});

export async function getDataHighlights(data: OlliDataset): Promise<OlliPredicateNode[]> {
  return [];
}

export async function semanticBins(selection: OlliDataset, field: string): Promise<OlliPredicateNode[]> {
  return [];
}

export function extractAndParseJSON(llmResponse: string) {
  // Find the index of the first opening brace
  const startIndex = llmResponse.indexOf('{');
  if (startIndex === -1) {
    throw new Error('No JSON object found in the string');
  }

  let openBraces = 0;
  let endIndex = startIndex;

  // Iterate through the string to find the matching closing brace
  for (let i = startIndex; i < llmResponse.length; i++) {
    if (llmResponse[i] === '{') {
      openBraces++;
    } else if (llmResponse[i] === '}') {
      openBraces--;
      if (openBraces === 0) {
        endIndex = i;
        break;
      }
    }
  }

  if (openBraces !== 0) {
    throw new Error('Invalid JSON object');
  }

  // Extract the JSON string
  const jsonString = llmResponse.substring(startIndex, endIndex + 1);

  // Parse and return the JSON object
  try {
    return parse(jsonString);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}
