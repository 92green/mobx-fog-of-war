import {sortByArgsArray} from './sortByArgsArray';
import type {GetArgs, MissingError} from './sortByArgsArray';
import type {Receive} from './Store';

import {of, from, pipe} from 'rxjs';
import type {Observable, OperatorFunction} from 'rxjs';

import {bufferCount, bufferTime, catchError, concatMap, mergeMap, map} from 'rxjs/operators';

interface Options<A,D,E> {
    request: (argsArray: A[]) => Observable<Array<D>>|Promise<Array<D>>;
    bufferTime: number;
    batch: number;
    getArgs: GetArgs<A,D>;
    requestError: (error: unknown, argsArray: A[]) => E;
    missingError: MissingError<A,E>;
}

export const rxBatch = <A,D,E>(options: Options<A,D,E>): OperatorFunction<A, Receive<A,D,E>> => {
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
        mergeMap((argsArray: A[]) => from(argsArray).pipe(
            bufferCount(batch)
        )),
        concatMap((argsArray: A[]) => of(argsArray).pipe(
            mergeMap(request),
            map((items: D[]) => sortByArgsArray(argsArray, items, getArgs, missingError)),
            catchError((err: unknown) => {
                const error = requestError(err, argsArray);
                return of(argsArray.map(args => ({args, error})));
            })
        )),
        mergeMap((items: Array<Receive<A,D,E>>) => from(items))
    );
};
