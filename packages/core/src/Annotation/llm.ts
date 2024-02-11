import OpenAI from 'openai';
import { OlliDataset } from '../Types';
import { backOff } from 'exponential-backoff';
// const fs = require("fs");


const secrets = process.env.NODE_ENV === 'development' ? require('../secrets/openai.json') : {};
const openai = new OpenAI({
    apiKey: secrets['OPENAI_API_KEY'],
    dangerouslyAllowBrowser: true
});

export async function llmBin(dataset: OlliDataset, field1: string, field2: string): Promise<string> {
    if (dataset.length === 0) {
        return '';
    }
    else {
        // const tempFilePath = './tempfile.json';

        // // Write the JSON string to a temporary file
        // fs.writeFile(tempFilePath, JSON.stringify(dataset), async (err) => {
        //     if (err) throw err;
        //     console.log('Temporary file created.');
        //     // Once the file is created, upload it to OpenAI
        // });

        // const file = await openai.files.create({
        //     file: fs.createReadStream(tempFilePath),
        //     purpose: "assistants",
        // });

        // fs.unlink(tempFilePath, (err) => {
        //     if (err) throw err;
        //     console.log('Temporary file deleted.');
        // });

        const chat = await openai.chat.completions.create({
            model: "gpt-4-turbo-preview",
            response_format: { "type": "json_object" },
            seed: 1,
            messages: [
                {role: "system", content: `Please analyze the uploaded dataset. You will be breaking down the data into 
                bins. You will format your answers using the Vega-Lite predicate schema. Each bin must have at least
                one predicate. Each predicate must have a field and a property that helps specify what data for a field falls in 
                the subset: equal, lt (less than), lte (less than or equal), gt (greater than), gte (greater than or equal), 
                range, or oneOf.
                
                For example, if we have:
    
                {
                    "bins": ["Compact", "Mid-Size", "Full-Size"]
                },
                
                You should output:
                
                { bins: [
                        {
                            "bin_name": "Compact",
                            "reasoning": [insert detailed reasoning these boundaries],
                            "pred": [
                                {
                                "field": "Displacement",
                                "lte": 100,
                                }, 
                                {
                                "field": "Horsepower",
                                "lte": 20,
                                }
                            ]
                        },
                        {
                            "bin_name": "Mid-Size",
                            "reasoning": [insert detailed reasoning these boundaries],
                            "pred": [
                                {
                                "field": "Displacement",
                                "range": [101, 150],
                                }, 
                                {
                                "field": "Horsepower",
                                "range": [25-30],
                                }
                            ]
                        },
                        {
                            "bin_name": "Full-Size",
                            "reasoning": [insert detailed reasoning for these boundaries],
                            "pred": [
                                {
                                "field": "Displacement",
                                "gte": 151,
                                }, 
                                {
                                "field": "Horsepower",
                                "gt": 50,
                                }
                            ]
                        }
                    ]
                }
    
                Another example, if we have:
    
                {
                    "bins": ["Japan", "USA", "France"]
                },
                
                You should output:
                
                { bins: [
                        {
                            "bin_name": "Japan",
                            "reasoning": [insert detailed reasoning these boundaries],
                            "pred": [
                                {
                                "field": "car_origin",
                                "oneOf": ["nissan", "lexus"]
                                }
                            ]
                        },
                        {
                            "bin_name": "USA",
                            "reasoning": [insert detailed reasoning for these boundaries],
                            "pred": [
                                {
                                "field": "car_origin",
                                "oneOf": ["ford", "ram"]
                                }
                            ]
                        },
                        {
                            "bin_name": "France",
                            "reasoning": [insert detailed reasoning for these boundaries],
                            "pred": [
                                {
                                "field": "car_origin",
                                "oneOf": ["renault", "citroen"]
                                }
                            ]
                        }
                    ]
                }`},
                {
                    role: "user",
                    content: `Here is the data we'll be analyzing: ${JSON.stringify(dataset)}`
                },
                {
                    role: "user", 
                    content: 
                    `Given the data, come up with meaningful bins of the data. It's ok to have overlap across bins. 
                    Make sure to give a full response in a JSON format. Do not change the names of the fields in your answer.
                    `
                }
            ]
        });

        // const thread = await openai.beta.threads.create({
        //     messages: [
        //         {
        //             role: "user",
        //             content: `Here is the data we'll be analyzing: ${JSON.stringify(dataset)}`
        //         },
        //         {
        //             role: "user", 
        //             content: 
        //             `Given the data, come up with meaningful bins of the data. It's ok to have overlap across bins. 
        //             Make sure to give a full response. Do not change the names of the fields in your answer.
        //             `
        //         }
        //     ]
        // });

        // const run = await openai.beta.threads.runs.create(
        //     thread.id,
        //     { 
        //         assistant_id: assistant.id,
        //     }
        // );

        // let checkRunStatus = await openai.beta.threads.runs.retrieve(
        //     thread.id,
        //     run.id
        // );

        // while (checkRunStatus.status === "queued" || checkRunStatus.status === "in_progress") {
        //     console.log(checkRunStatus.status);
        //     // Wait for 5 seconds before checking the status again
        //     await new Promise(resolve => setTimeout(resolve, 5000));
            
        //     checkRunStatus = await openai.beta.threads.runs.retrieve(
        //         thread.id,
        //         run.id
        //     );
        // };

        // const messages = await openai.beta.threads.messages.list(
        //     thread.id
        // );

        // console.log(messages);

        // if (messages.data[0].content[0].type == "text") {
        //     console.log(messages.data[0].content[0].text.value);
        //     return (messages.data[0].content[0].text.value);
        // }
        console.log(chat.choices[0].message.content);

        return chat.choices[0].message.content;
    }
}