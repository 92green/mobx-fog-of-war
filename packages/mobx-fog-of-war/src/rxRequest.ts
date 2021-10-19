import type {Store, Receive} from './Store';
import {Subject} from 'rxjs';
import type {OperatorFunction} from 'rxjs';

export const rxRequest = <A,D,E>(operator: OperatorFunction<A, Receive<A,D,E>>) => (store: Store<A,D,E>): ((args: A) => void) => {
    const subject = new Subject<A>();
    subject
        .pipe(operator)
        .subscribe(received => store.receive(received));
    
    return (args: A): void => {
        subject.next(args);   
    };
};
