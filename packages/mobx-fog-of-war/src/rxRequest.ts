import {toJS} from 'mobx';
import {toStream} from 'mobx-utils';
import type {Store, NextRequest, Receive} from './Store';
import {map} from 'rxjs/operators';
import {from} from 'rxjs';
import type {OperatorFunction} from 'rxjs';

export const rxRequest = <Args,Data,Err>(operator: OperatorFunction<Args, Receive<Args,Data,Err>>) => {
    return (store: Store<Args,Data,Err>): void => {
        from(toStream((): NextRequest<Args> => toJS(store.nextRequest) as NextRequest<Args>))
            .pipe(
                map(item => item.args),
                operator
            )
            .subscribe(received => store.receive(received));
    };
};
