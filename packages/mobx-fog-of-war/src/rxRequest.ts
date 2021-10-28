import type {Store, Receive, StoreOptionsRequest} from './Store';
import {Subject, of} from 'rxjs';
import {mergeMap, map, catchError} from 'rxjs/operators';
import type {OperatorFunction} from 'rxjs';

export const rxRequest = <A,D,E,AA>(operator: OperatorFunction<A, Receive<A,D,E>>) => (store: Store<A,D,E,AA>): ((args: A) => void) => {
    const subject = new Subject<A>();
    subject
        .pipe(operator)
        .subscribe(received => store.receive(received));
    
    return (args: A): void => {
        subject.next(args);   
    };
};

export const rxRequestEach = <A,D,E,AA>(operator: OperatorFunction<A,D>): StoreOptionsRequest<A,D,E,AA> => {
    return rxRequest<A,D,E,AA>(
        mergeMap((args) => {
            return of(args).pipe(
                operator,
                map((data) => ({
                    args,
                    data
                })),
                catchError((error) => of({
                    args,
                    error
                }))
            );
        })
    );
};