import { config } from "./config";

async function GET_SERVICES(){
    const apiKey = config.api.token;
    const apiUrl = config.api.url + "/services";
    const requestOptions = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },

      };
    const read = await fetch(apiUrl,requestOptions);
    const json = await read.json()
    console.log(json);
}

export {GET_SERVICES as GetServices};