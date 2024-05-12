
const fs = require('fs');
const acorn = require('acorn');
// const acorn_jsx = require("acorn-jsx");
const walk = require("acorn-walk")


function extractFunctionsFromFile(filePath) {
    const sourceCode = fs.readFileSync(filePath, 'utf8');

    const ast = acorn.parse(sourceCode, { ecmaVersion: 'latest', sourceType: 'module' });

    const functions = [];

    const extractNodeData = ({ name = '', type = null, params = [], body = '', start = null }) => ({
        name: name,
        type: type,
        params: params.map(param => param.name),
        body: sourceCode.substring(body.start, body.end).trim(),
        filePath: filePath,
        start: start
    })

    /**
     * Functions: https://github.com/estree/estree/blob/master/es5.md#declarations
     */
    walk.simple(ast, {
        FunctionDeclaration(node) {
            console.log(node);
            functions.push(extractNodeData({
                name: node.id.name,
                params: node.params,
                body: node.body,
                start: node.start,
                type: node.type
            }));
        },
        VariableDeclarator(node) {
            if (node.init && (node.init.type === 'FunctionExpression' || node.init.type === 'ArrowFunctionExpression')) {
                functions.push(extractNodeData({
                    name: node.id.name,
                    params: node.init.params,
                    body: node.init.body,
                    start: node.start,
                    type: node.type
                }));
            }
        },
    });

    return functions;
}

module.exports = {
    extractFunctionsFromFile
}
