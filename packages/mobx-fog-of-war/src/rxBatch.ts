import {sortByArgsArray} from './sortByArgsArray';
import type {GetArgs, MissingError} from './sortByArgsArray';
import type {Receive} from './Store';

import {of, from, pipe} from 'rxjs';
import type {Observable, OperatorFunction} from 'rxjs';

import {bufferCount, bufferTime, catchError, concatMap, mergeMap, map} from 'rxjs/operators';

interface Options<Args,Data,Err> {
    request: (argsArray: Args[]) => Observable<Array<Data>>|Promise<Array<Data>>;
    bufferTime: number;
    batch: number;
    getArgs: GetArgs<Args,Data>;
    requestError: (error: unknown, argsArray: Args[]) => Err;
    missingError: MissingError<Args,Err>;
}

export const rxBatch = <Args,Data,Err>(options: Options<Args,Data,Err>): OperatorFunction<Args, Receive<Args,Data,Err>> => {
    const {
        request,
        bufferTime: time,
        batch,
        getArgs,
        requestError,
        missingError
    } = options;

    return pipe(
        bufferTime(time),
        mergeMap((argsArray: Args[]) => from(argsArray).pipe(
            bufferCount(batch)
        )),
        concatMap((argsArray: Args[]) => of(argsArray).pipe(
            mergeMap(request),
            map((items: Data[]) => sortByArgsArray(argsArray, items, getArgs, missingError)),
            catchError((err: unknown) => {
                const error = requestError(err, argsArray);
                return of(argsArray.map(args => ({args, error})));
            })
        )),
        mergeMap((items: Array<Receive<Args,Data,Err>>) => from(items))
    );
};
