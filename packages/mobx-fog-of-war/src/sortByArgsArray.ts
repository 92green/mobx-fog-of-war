import {argsToKey} from './argsToKey';
import type {Receive} from './Store';

export type GetArgs<A,R> = (result: R) => A;
export type GetData<D,R> = (result: R) => D;
export type MissingError<A,E> = (args: A) => E;

export const sortByArgsArray = <A,D,E,R>(
    argsArray: A[],
    resultArray: R[],
    getArgs: GetArgs<A,R>,
    getData: GetData<D,R>,
    missingError: MissingError<A,E>
): Receive<A,D,E>[] => {

    const dataByKey = new Map<string,R>();

    resultArray.forEach((result: R) => {
        dataByKey.set(argsToKey(getArgs(result)), result);
    });

    return argsArray.map((args: A): Receive<A,D,E> => {
        const key = argsToKey(args);
        if(dataByKey.has(key)) {
            return {
                args,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                data: getData(dataByKey.get(key)!)
            };
        }
        return {
            args,
            error: missingError(args)
        };
    });
};
