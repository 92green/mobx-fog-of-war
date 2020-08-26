import {Store, asyncRequest} from '../src/index';
import {mocked} from 'ts-jest/utils';

interface Place {
    id: string;
    name: string;
}

type PlaceArgs = string;

describe('asyncRequest', () => {
    it('should fire promise returning function and receive data', async () => {

        const promise = {
            current: Promise.resolve({
                id: '',
                name: ''
            })
        };

        const placeStore = new Store<PlaceArgs,Place,string>({
            request: asyncRequest(args => {
                promise.current = Promise.resolve({
                    id: 'a',
                    name: `data for ${args}`
                });
                return promise.current;
            })
        });

        placeStore.receive = jest.fn();
        placeStore.request('one');

        await promise.current;

        expect(mocked(placeStore.receive)).toHaveBeenCalledTimes(1);
        expect(mocked(placeStore.receive).mock.calls[0][0]).toEqual({
            args: 'one',
            data: {
                id: 'a',
                name: 'data for one'
            }
        });

    });

    it('should fire promise returning function and receive error', async () => {

        expect.assertions(2);

        const promise = {
            current: Promise.resolve({
                id: '',
                name: ''
            })
        };

        const placeStore = new Store<PlaceArgs,Place,string>({
            request: asyncRequest(() => {
                promise.current = Promise.reject('ARGH!');
                return promise.current;
            })
        });

        placeStore.receive = jest.fn();
        placeStore.request('one');

        try {
            await promise.current;
        } catch(error) {

            expect(mocked(placeStore.receive)).toHaveBeenCalledTimes(1);
            expect(mocked(placeStore.receive).mock.calls[0][0]).toEqual({
                args: 'one',
                error: 'ARGH!'
            });
        }
    });
});
