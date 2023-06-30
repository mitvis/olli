import { OlliDataset } from 'olli';
import { Configuration, OpenAIApi } from 'openai';
import { backOff } from 'exponential-backoff';
import { isDate } from 'vega';

const secrets = process.env.NODE_ENV === 'development' ? require('../secrets/openai.json') : {};
const configuration = new Configuration(secrets);

const openai = new OpenAIApi(configuration);

/**
 *  set FLAG to true to make API calls, set to false to use cached results
 */
// const FLAG = true;
const FLAG = false;

export async function llmDescribe(selection: OlliDataset): Promise<string> {
  if (selection.length === 0) {
    return '';
  }
  if (selection.length > 100) {
    console.warn('llmDescribe called with more than 100 rows');
    selection = selection.slice(0, 100);
  }
  let csvData: string = '';
  csvData += Object.keys(selection[0]).join() + '\n';
  csvData += selection
    .map((d) =>
      Object.values(d)
        .map((v) => (isDate(v) ? v.toLocaleDateString() : v?.toString()))
        .join()
    )
    .join('\n');

  console.log(csvData);

  const storageKey = String(hashCode(csvData));

  const cache = localStorage.getItem(storageKey);
  if (cache) {
    console.log('cache hit');
    return cache;
  } else if (FLAG) {
    console.log('attempting api call');
    const response = await backOff(() => {
      return openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt(csvData) }],
      });
    });
    const description = response.data.choices[0].message.content;
    console.log('api call returned');

    localStorage.setItem(storageKey, description);
    return description;
  }
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0, len = str.length; i < len; i++) {
    let chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

function prompt(stringData: string): string {
  const prompt = `You are an expert data analyst. Describe trends and patterns in the following data. If relevant, include information about current events and social context. Answer in 2 sentences:

${stringData}`;

  return prompt;
}
