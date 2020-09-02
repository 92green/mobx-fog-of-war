import {autorun, toJS, action} from 'mobx';
import type {Store} from './Store';

type Requester<A,D> = (args: A) => Promise<D>;

export const asyncRequest = <A,D,E>(requester: Requester<A,D>) => (store: Store<A,D,E>): void => {
    autorun(() => {
        const nextRequestPlain = toJS(store.nextRequest);
        if(!nextRequestPlain) return;

        const {args} = nextRequestPlain;
        requester(args).then(
            action(data => store.receive({args, data})),
            action(error => store.receive({args, error}))
        );
    });
};
