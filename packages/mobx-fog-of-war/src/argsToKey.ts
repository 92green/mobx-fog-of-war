export const argsToKey = (args: unknown): string => {

    // process only collections (objects and arrays)
    if (args instanceof Object) {

        // make entries
        const entries: Array<[number|string, unknown]> = [];
        for (const key in args) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const value: unknown = args[key];
            if(value !== undefined && value !== null) {
                entries.push([key, value]);
            }
        }

        // sort by key so differences in key order don't produce different results
        entries.sort((a, b) => a[0] < b[0] ? -1 : 1);

        // recurse to children
        args = entries.map(([key, value]) => [key, argsToKey(value)]);
    }

    // stringify result
    return JSON.stringify(args) || '';
};
