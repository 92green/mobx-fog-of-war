import {toJS} from 'mobx';
import {toStream} from 'mobx-utils';
import type {Store, NextRequest} from './Store';
import {map} from 'rxjs/operators';
import {from, pipe} from 'rxjs';
import type {OperatorFunction} from 'rxjs';

// rxjs demans the use of any types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const rxRequest = <Args,Data,Err>(...operators: Array<OperatorFunction<any, any>>) => (store: Store<Args,Data,Err>): void => {
    from(toStream((): NextRequest<Args> => toJS(store.nextRequest) as NextRequest<Args>))
        .pipe(
            map(item => item.args),
            // rxjs doesnt like spreading into a pipe
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            pipe(...operators)
        )
        .subscribe(received => store.receive(received));
};
