import {Store, batchRequest} from '../src/index';
import type {Receive} from '../src/index';
import {mocked} from 'ts-jest/utils';

jest.useFakeTimers();

type Place = {
    id: string;
    name: string;
};

type PlaceArgs = string;

describe('batchRequest', () => {

    it('should batch requested items', async () => {

        const requester = jest.fn(async (argsArray: PlaceArgs[]): Promise<Receive<PlaceArgs,Place|undefined,string>[]> => {
            return argsArray.map(args => {
                return {
                    args,
                    data: {
                        id: args,
                        name: `${args}!`
                    }
                };
            });
        });

        const placeStore = new Store<PlaceArgs,Place,string>({
            request: batchRequest(requester)
        });

        placeStore.request('one');
        placeStore.request('two');
        placeStore.request('three');

        // we are still buffering, so nothing should be requested yet
        expect(requester).toHaveBeenCalledTimes(0);

        // move time forward
        jest.advanceTimersByTime(15);

        // request should be called now
        expect(requester).toHaveBeenCalledTimes(1);

        const result = await Promise.all([
            placeStore.read('one').promise(),
            placeStore.read('two').promise(),
            placeStore.read('three').promise()
        ]);

        expect(result.map(r => r.data)).toEqual([
            {id: 'one', name: 'one!'},
            {id: 'two', name: 'two!'},
            {id: 'three', name: 'three!'}
        ]);

        expect(requester).toHaveBeenCalledTimes(1);
        expect(mocked(requester).mock.calls[0][0]).toEqual(['one','two','three']);
    });

    // it('should fire promise returning function and receive error', async () => {

    //     const changes = jest.fn();

    //     const promise = {
    //         current: Promise.resolve({
    //             id: '',
    //             name: ''
    //         })
    //     };

    //     const placeStore = new Store<PlaceArgs,Place,string>({
    //         request: batchRequest(() => {
    //             promise.current = Promise.reject('ARGH!');
    //             return promise.current;
    //         })
    //     });

    //     autorun(() => {
    //         changes(toJS(placeStore.read('one')));
    //     });

    //     placeStore.request('one');

    //     try {
    //         await promise.current;
    //         // eslint-disable-next-line no-empty
    //     } catch(e) {}

    //     expect(mocked(changes)).toHaveBeenCalledTimes(3);
    //     expect(mocked(changes).mock.calls[0][0].loading).toBe(false);
    //     expect(mocked(changes).mock.calls[1][0].loading).toBe(true);
    //     expect(mocked(changes).mock.calls[2][0].error).toBe('ARGH!');
    // });
});
