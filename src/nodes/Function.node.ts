import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
} from "n8n-workflow"
import {NodeVM} from "vm2"
import {assert} from "../util"
import {createVMScriptForTS} from "../util/transform"

const DEFAULT = `\
import {IExecuteFunctions, INodeExecutionData} from "n8n-workflow"

export default async function(this: IExecuteFunctions, items: INodeExecutionData[]) {
    return items;
}`

export class Function implements INodeType {
    description: INodeTypeDescription = {
        displayName: "TypeScript Function",
        name: "typescript-function",
        icon: "fa:code",
        group: ["transform"],
        version: 1,
        description:
            "Run custom function code which gets executed once per item.",
        defaults: {
            name: "TypeScript Function",
            color: "#FF9922",
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
                description: "The TypeScript code to execute.",
                noDataExpression: true,
            },
        ],
    }

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        // const item = this.getInputData();
        let items = this.getInputData()

        // Copy the items as they may get changed in the functions
        items = JSON.parse(JSON.stringify(items))

        // To be able to access data of other items
        const $item = (index: number) => this.getWorkflowDataProxy(index)
        // Define the global objects for the custom function
        const sandbox = {
            $item,

            // Make it possible to access data via $node, $parameter, ...
            // By default use data from first item
            ...$item(0),
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
        return await this.prepareOutputData(
            await Promise.resolve(fn.call(this, items)),
        )
    }
}
