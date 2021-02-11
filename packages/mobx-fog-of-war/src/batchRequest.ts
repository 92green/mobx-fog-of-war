import {autorun, toJS, action} from 'mobx';
import type {Store, Receive} from './Store';

type Requester<A,D,E> = (args: A[]) => Promise<Receive<A,D|undefined,E>[]>;

type Options = {
    bufferTime?: number;
    batchSize?: number;
};

export const batchRequest = <A,D,E>(requester: Requester<A,D,E>, options: Options = {}) => (store: Store<A,D,E>): void => {

    const {
        bufferTime = 0.01,
        batchSize = 25
    } = options;

    let buffer: A[] = [];

    const flush = () => {
        if(buffer.length === 0) return;
        const argsArray = buffer;
        buffer = [];

        requester(argsArray).then(
            action((items: Receive<A,D|undefined,E>[]) => {
                items.forEach(item => store.receive(item));
            }),
            action((error: E) => {
                argsArray.forEach(args => store.receive({args, error}));
            })
        );
    };

    autorun(() => {

        // trigger autorun by reading store.nextRequest
        const nextRequestPlain = toJS(store.nextRequest);
        if(!nextRequestPlain) return;
        const {args} = nextRequestPlain;

        // start new buffer if none exists
        if(buffer.length === 0) {
            setTimeout(flush, bufferTime);
        }

        // add item to buffer
        buffer.push(args);

        // flush buffer if batch size is reached
        if(buffer.length >= batchSize) {
            flush();
        }
    });
};
