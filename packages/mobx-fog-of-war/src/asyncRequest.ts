import {autorun, toJS, flow} from 'mobx';
import type {Store} from './Store';

type Requester<Args,Data> = (args: Args) => Promise<Data>;

export const asyncRequest = <Args,Data,Err>(requester: Requester<Args,Data>) => (store: Store<Args,Data,Err>): void => {
    autorun(() => {
        const nextRequestPlain = toJS(store.nextRequest);
        if(!nextRequestPlain) return;

        const {args} = nextRequestPlain;
        flow(function* () {
            try {
                const data = yield requester(args);
                store.receive({args, data});
            } catch(error) {
                store.receive({args, error});
            }
        })();
    });
};
