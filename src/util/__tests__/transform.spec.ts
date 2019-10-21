import {describe, expect, it} from "@nimashoghi/test"
import fc from "fast-check"

const code = (...lines: string[]) => lines.join(";\n")

describe("getCodeFor", () => {
    it.prop(
        "converts typescript to javascript",
        fc.integer(),
        fc.string(),
        async (integer, string) => {
            const {getCodeFor} = await import("../transform")

            const typescript = code(
                `let x: number = ${JSON.stringify(integer)}`,
                `let y: string = ${JSON.stringify(string)}`,
            )

            const javascript = await getCodeFor(typescript)
            expect(javascript).toMatchSnapshot()
        },
    )

    it.prop(
        "converts es6 exports to module.exports",
        fc.anything(),
        async x => {
            const {getCodeFor} = await import("../transform")

            const typescript = code(`export default ${JSON.stringify(x)}`)
            const javascript = await getCodeFor(typescript)
            expect(javascript).toMatch(/exports\.default/)
            expect(javascript).toMatchSnapshot()
        },
    )
})
