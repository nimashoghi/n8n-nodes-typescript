import * as babel from "@babel/core"
import {VMScript} from "vm2"
import {assert} from "./assert"

export const getCodeFor = async (code: string, filename = "script.ts") => {
    const result = await babel.transformAsync(code, {
        filename,
        presets: [
            "@babel/preset-typescript",
            [
                "@babel/preset-env",
                {
                    targets: {
                        node: "current",
                    },
                },
            ],
        ],
    })
    assert(result && result.code, `Failed to transform code using Babel!`)
    return result.code
}

export const createVMScriptForTS = async (code: string) =>
    new VMScript(await getCodeFor(code))
