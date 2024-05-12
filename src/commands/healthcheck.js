
const vscode = require('vscode');
const { pingAI } = require('../utils/ai-com');

const HealthCheckCommand = (context, ollama_status) => {
    let healthcheck = vscode.commands.registerCommand('simple-ollama.healthcheck', async function () {
        // vscode.window.showInformationMessage("Testing Ollama..");

        ollama_status.text = '$(loading~spin) Ollama';
        ollama_status.color = new vscode.ThemeColor("statusBar.foreground");
        ollama_status.show()
        await new Promise(resolve => setTimeout(resolve, 1000));

        const serverStatus = await pingAI()

        ollama_status.tooltip = 'Ollama server is '

        if (serverStatus) {
            vscode.commands.executeCommand('setContext', 'simple-ollama.enabled', true);

            ollama_status.text = '$(check) Ollama'
            ollama_status.color = 'green'
            ollama_status.tooltip += 'up and running'

        } else {
            vscode.commands.executeCommand('setContext', 'simple-ollama.enabled', false);

            ollama_status.text = '$(close) Ollama'
            ollama_status.color = "indianred"
            ollama_status.tooltip += 'down.'
            const userRes = await vscode.window.showInformationMessage(
                "Ollama Server seems to be down. See Ollama Docs for details",
                "Ollama Docs"
            );

            if (userRes !== undefined) {
                vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('https://github.com/ollama/ollama'));
            }

        }


    });
    context.subscriptions.push(healthcheck);
}

module.exports = {
    HealthCheckCommand
};
