import {argsToKey} from './argsToKey';
import type {Receive} from './Store';

export type GetArgs<A,D> = (data: D) => A;
export type MissingError<A,E> = (args: A) => E;

export const sortByArgsArray = <A,D,E>(
    argsArray: A[],
    dataArray: D[],
    getArgs: GetArgs<A,D>,
    missingError: MissingError<A,E>
): Receive<A,D,E>[] => {

    const dataByKey = new Map<string,D>();

    dataArray.forEach((data: D) => {
        dataByKey.set(argsToKey(getArgs(data)), data);
    });

    return argsArray.map((args: A): Receive<A,D,E> => {
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
