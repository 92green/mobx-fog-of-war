import {argsToKey} from './argsToKey';
import type {Receive} from './Store';

type Mapper<Data> = (data: Data) => unknown;
type Errorer<Args,Err> = (args: Args) => Err;

export const sortByArgsArray = <Args,Data,Err>(
    argsArray: Args[],
    dataArray: Data[],
    mapper: Mapper<Data>,
    errorer: Errorer<Args,Err>
): Receive<Args,Data,Err>[] => {

    const dataByKey = new Map<string,Data>();

    dataArray.forEach((data: Data) => {
        dataByKey.set(argsToKey(mapper(data)), data);
    });

    return argsArray.map((args: Args): Receive<Args,Data,Err> => {
        const key = argsToKey(args);
        if(dataByKey.has(key)) {
            return {
                args,
                data: dataByKey.get(key)!
            };
        }
        return {
            args,
            error: errorer(args)
        };
    });
};
