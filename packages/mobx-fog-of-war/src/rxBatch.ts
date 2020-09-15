import {sortByArgsArray} from './sortByArgsArray';
import type {GetArgs, MissingError} from './sortByArgsArray';
import type {Receive} from './Store';

import {of, from, pipe} from 'rxjs';
import type {Observable, OperatorFunction} from 'rxjs';

import {bufferCount, bufferTime, catchError, concatMap, mergeMap, map} from 'rxjs/operators';

interface Options<A,D,E,R> {
    request: (argsArray: A[]) => Observable<Array<R>>|Promise<Array<R>>;
    bufferTime: number;
    batch: number;
    getArgs: GetArgs<A,R>;
    getData: GetArgs<D,R>;
    requestError: (error: unknown, argsArray: A[]) => E;
    missingError: MissingError<A,E>;
}

export const rxBatch = <A,D,E,R>(options: Options<A,D,E,R>): OperatorFunction<A, Receive<A,D,E>> => {
    const {
        request,
        bufferTime: time,
        batch,
        getArgs,
        getData,
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
            map((resultArray: R[]) => sortByArgsArray(argsArray, resultArray, getArgs, getData, missingError)),
            catchError((err: unknown) => {
                const error = requestError(err, argsArray);
                return of(argsArray.map(args => ({args, error})));
            })
        )),
        mergeMap((items: Array<Receive<A,D,E>>) => from(items))
    );
};
