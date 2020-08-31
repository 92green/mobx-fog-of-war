import {autorun, toJS, action} from 'mobx';
import type {Store} from './Store';

type Requester<Args,Data> = (args: Args) => Promise<Data>;

export const asyncRequest = <Args,Data,Err>(requester: Requester<Args,Data>) => (store: Store<Args,Data,Err>): void => {
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
