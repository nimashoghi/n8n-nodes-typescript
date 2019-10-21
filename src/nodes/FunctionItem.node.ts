import {
    IExecuteSingleFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from "n8n-workflow"
import {NodeVM} from "vm2"
import {assert} from "../util"
import {createVMScriptForTS} from "../util/transform"

const DEFAULT = `\
import {IExecuteSingleFunctions, INodeExecutionData} from "n8n-workflow"

export default async function(this: IExecuteSingleFunctions, item: INodeExecutionData) {
    return item;
}`

export class FunctionItem implements INodeType {
    description: INodeTypeDescription = {
        displayName: "TypeScript Function Item",
        name: "typescriptFunctionItem",
        icon: "fa:code",
        group: ["transform"],
        version: 1,
        description:
            "Run custom function code which gets executed once per item.",
        defaults: {
            name: "TypeScript FunctionItem",
            color: "#ddbb33",
        },
        inputs: ["main"],
        outputs: ["main"],
        properties: [
            {
                displayName: "Function",
                name: "functionCode",
                typeOptions: {
                    alwaysOpenEditWindow: true,
                    editor: "code",
                    rows: 10,
                },
                type: "string",
                default: DEFAULT,
                description: "The JavaScript code to execute for each item.",
                noDataExpression: true,
            },
        ],
    }

    async executeSingle(
        this: IExecuteSingleFunctions,
    ): Promise<INodeExecutionData> {
        let item = this.getInputData()

        // Copy the items as they may get changed in the functions
        item = JSON.parse(JSON.stringify(item))

        // Define the global objects for the custom function
        const sandbox = {
            // Make it possible to access data via $node, $parameter, ...
            ...this.getWorkflowDataProxy(),
        }

        const vm = new NodeVM({
            console: "inherit",
            sandbox,
            require: {
                external: true,
                root: "./",
            },
        })

        // Get the code to execute
        const code = this.getNodeParameter("functionCode", 0)
        assert(code, "Code must not be undefined")
        assert(typeof code === "string", "Code must not be undefined")
        const fn: globalThis.Function = (await vm.run(
            await createVMScriptForTS(code),
        )).default

        return {
            json: await Promise.resolve(fn.call(this, item)),
        }
    }
}
