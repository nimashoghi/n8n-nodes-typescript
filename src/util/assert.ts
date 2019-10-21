export function assert(condition: unknown, message = "assertion failed"): asserts condition {
    if (!condition) {
        throw new Error(message)
    }
}

export function invariant(condition: unknown, message = "invariant failed"): asserts condition {
    if (!condition) {
        throw new Error(message)
    }
}

export function unreachable(message = "this code is unreachable"): never {
    throw new Error(message)
}
