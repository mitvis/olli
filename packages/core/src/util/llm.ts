import OpenAI from 'openai';
import { OlliPredicateNode } from '../Structure/Types';
import { OlliDataset } from '../Types';
import * as jsonc from 'jsonc-parser';
import { ChatCompletionMessageParam } from 'openai/resources';
import { LogicalComposition } from 'vega-lite/src/logical';
import { FieldPredicate } from 'vega-lite/src/predicate';
import { backOff } from 'exponential-backoff';
import { simplifyPredicate } from './selection';

const secrets = process.env.NODE_ENV === 'development' ? require('../secrets/openai.json') : {};
const openai = new OpenAI({
  apiKey: secrets['apiKey'],
  dangerouslyAllowBrowser: true,
});

type LLMResponse = {
  groups: OlliPredicateNode[];
};

export async function getDataHighlights(data: OlliDataset): Promise<OlliPredicateNode[]> {
  const csvData = toCSV(data);
  const storageKey = String(hashCode(csvData));
  const cache = localStorage.getItem(storageKey);

  if (cache) {
    console.log('cache hit');
    return JSON.parse(cache);
  } else {
    const llmResponse = await queryLLM(dataHighlightPrompt(csvData));
    const groups = llmResponse.groups.map((group) => {
      return {
        ...group,
        predicate: simplifyPredicate(group.predicate),
      };
    });
    localStorage.setItem(storageKey, JSON.stringify(groups));
    return groups;
  }
}

export async function semanticBins(selection: OlliDataset, field: string): Promise<OlliPredicateNode[]> {
  return [];
}

const FLAG = true;

async function queryLLM(messages: ChatCompletionMessageParam[]): Promise<LLMResponse> {
  if (!FLAG) {
    console.log('FLAG is false. did not query');
    return { groups: [] };
  }
  console.log('attempting api call');
  const chat = await backOff(() => {
    return openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      response_format: { type: 'json_object' },
      seed: 1,
      messages,
    });
  });
  console.log('api call returned');

  return jsonc.parse(chat.choices[0].message.content);
}

const toCSV = (data: OlliDataset) => {
  const header = Object.keys(data[0]).join(',');
  const rows = data.map((row) => Object.values(row).join(','));
  return [header, ...rows].join('\n');
};

function hashCode(str) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

const dataHighlightPrompt = (csvData: string): ChatCompletionMessageParam[] => {
  return [
    {
      role: 'system',
      content: `You are an expert data analyst. When I provide a dataset, you respond with a list of JSON objects identifying semantically meaningful groupings of data.`,
    },
    {
      role: 'user',
      content: `Here is the data we'll be analyzing: ${csvData}`,
    },
    {
      role: 'user',
      content: `Given the data, identify meaningful groupings of data. Consider all the fields in the data. Incorporate domain-specific knowledge, social and political context, and history or current events. Prioritize groupings that are interesting or surprising, and may not be obvious just from looking at the data. Please respond in the format:
      {
        "groups": [...]
      }
        where each group is in the format:
      {
        "name": string,
        "explanation": string,
        "predicate": LogicalComposition<FieldPredicate>
      }
      Where "predicate" is a Vega-Lite predicate that selects the data points in the group. Convert all dates to utc time numeric format. Respond in JSON and return nothing but valid JSON.`,
    },
  ];
};
