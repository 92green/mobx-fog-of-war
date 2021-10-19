import {action} from 'mobx';
import type {Store} from './Store';

type Requester<A,D> = (args: A) => Promise<D>;

export const asyncRequest = <A,D,E,AA>(requester: Requester<A,D>) => (store: Store<A,D,E,AA>) => (args: A): void => {
    requester(args).then(
        action(data => store.receive({args, data})),
        action(error => store.receive({args, error}))
    );
};
