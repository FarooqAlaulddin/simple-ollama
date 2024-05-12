const fetch = require('node-fetch');


async function pingAI() {
    try {
        const url = 'http://localhost:11434';
        const res = await fetch(url)

        const body = res.body;

        let chunks = '';

        await new Promise((resolve, reject) => {
            body.on('readable', () => {
                let chunk;
                while (null !== (chunk = body.read())) {
                    chunks += chunk;
                }
            });
            body.on('end', () => {
                resolve();
            });
            body.on('error', (error) => {
                reject(error);
            });
        });

        return res.status === 200 && chunks === 'Ollama is running';
    } catch (error) {
        return false
    }
}

async function sendToAI(func, controller) {
    const url = 'http://localhost:11434/api/generate';
    const options = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json;charset=UTF-8'
        },
        signal: controller.signal,
        body: JSON.stringify({
            "model": "gemma:7b",
            "stream": false,
            "prompt": `
				Generate JSDocs for the following JS function:'
					Function Name: ${func.name}\n
					Function params: ${func.params}\n
					Function Body: ${func.body}\n
				Only generate JSDocs for the top level function ${func.name}\n
				Follow any comments instructions within the body of the function.
				`
        })
    };

    const res = await fetch(url, options)
    const json = await res.json();

    return json.response;
}

function extractJSDocsFromAI(str) {
    const regex = /\/\*\*.*\*\//smg;
    const jsdoc_string = regex.exec(str)
    return jsdoc_string
}

module.exports = {
    sendToAI,
    extractJSDocsFromAI,
    pingAI
}
