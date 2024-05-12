const vscode = require('vscode');

const { HealthCheckCommand } = require('./commands');

const { sendToAI, extractJSDocsFromAI } = require('./utils/ai-com');
const { extractFunctionsFromFile } = require('./utils/walk');


let ollama_status;


async function activate(context) {

	ollama_status = vscode.window.createStatusBarItem('ollama-status', vscode.StatusBarAlignment.Right, 100);
	ollama_status.command = 'simple-ollama.healthcheck'
	context.subscriptions.push(ollama_status);


	HealthCheckCommand(context, ollama_status);


	let disposable = vscode.commands.registerCommand('simple-ollama.helloWorld', async function () {

		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage("editor does not exist");
			console.log('Exit');
			return;
		}

		const controller = new AbortController();

		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Generate JSDocs",
			cancellable: true
		}, async (progress, token) => {
			return new Promise((async (resolve) => {

				token.onCancellationRequested(() => {
					controller.abort();
					resolve(null);
					vscode.window.showInformationMessage("Generate JSDocs Cancelled.");
				});

				progress.report({ increment: 0, message: "Acorns Walk.." });
				const functions = extractFunctionsFromFile(editor.document.uri.fsPath);


				progress.report({ increment: 5, message: `${functions.length} functions found..` });
				await new Promise(resolve => setTimeout(resolve, 2000));

				const editBuilder = new vscode.WorkspaceEdit();

				try {

					const totalFunctions = functions.length;
					let index = -1;

					for (let func of functions) {
						++index;

						const percentComplete = 5 + (index * 90 / totalFunctions);
						progress.report({ increment: percentComplete, message: `${index + 1}/${totalFunctions}: Sending ${func.name} to AI..` });

						const resFromAI = await sendToAI(func, controller)
						const jsdocs = extractJSDocsFromAI(resFromAI)

						const postion = editor.document.positionAt(func.start)
						const edit = new vscode.TextEdit(
							new vscode.Range(postion.line, 0, postion.line, 0),
							jsdocs + '\n'
						);

						editBuilder.set(editor.document.uri, [edit]);
					}

					progress.report({ increment: 95, message: "Posting to VS CODE" });
					vscode.workspace.applyEdit(editBuilder).then(() => {
						vscode.window.showInformationMessage('Comment added successfully.');
						progress.report({ increment: 100, message: "Done.." });
					});

					resolve(null);

				} catch (error) {
					console.log(error);
				}

				return true
			}));
		});
	});
	context.subscriptions.push(disposable);


	// inital ping to local ollama..
	vscode.commands.executeCommand('simple-ollama.healthcheck');

}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}


/*

const childProcess = require("child_process");
function execute(command) {
	return new Promise(function (resolve, reject) {
		childProcess.exec(command, function (error, standardOutput, standardError) {
			if (error) {
				reject();
				return;
			}
			if (standardError) {
				reject(standardError);
				return;
			}
			resolve(standardOutput);
		});
	});
}

fetch(url, options)
	.then(response => response.body)
	.then(res => res.on('readable', () => {

		let chunk;
		while (null !== (chunk = res.read())) {
			chunk = chunk.toString()
			chunk = JSON.parse(chunk).response

			editor.edit(edit => {
				edit.insert(editor.selection.end, chunk)
			});
		}

		editor.edit(edit => {
			edit.insert(editor.selection.active, '\n\n')
		});

	})).catch(e => console.log(e))


let jsdoc = await execute(`npx jsdoc ${editor.document.uri.fsPath} -X`);
jsdoc = JSON.parse(jsdoc);
const functions = jsdoc.filter(entry => entry.kind === 'function')
functions.forEach((func, i) => {
	let temp = extractFunctionsFromFile(func.meta.path + path.sep + func.meta.filename);
	functions[i]['info'] = temp
});

*/
