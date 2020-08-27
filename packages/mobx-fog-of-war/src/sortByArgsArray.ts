import {argsToKey} from './argsToKey';
import type {Receive} from './Store';

export type GetArgs<Args,Data> = (data: Data) => Args;
export type MissingError<Args,Err> = (args: Args) => Err;

export const sortByArgsArray = <Args,Data,Err>(
    argsArray: Args[],
    dataArray: Data[],
    getArgs: GetArgs<Args,Data>,
    missingError: MissingError<Args,Err>
): Receive<Args,Data,Err>[] => {

    const dataByKey = new Map<string,Data>();

    dataArray.forEach((data: Data) => {
        dataByKey.set(argsToKey(getArgs(data)), data);
    });

    return argsArray.map((args: Args): Receive<Args,Data,Err> => {
        const key = argsToKey(args);
        if(dataByKey.has(key)) {
            return {
                args,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                data: dataByKey.get(key)!
            };
        }
        return {
            args,
            error: missingError(args)
        };
    });
};
