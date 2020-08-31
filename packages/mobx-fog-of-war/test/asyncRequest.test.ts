import {Store, asyncRequest} from '../src/index';
import {mocked} from 'ts-jest/utils';
import {autorun, toJS} from 'mobx';

interface Place {
    id: string;
    name: string;
}

type PlaceArgs = string;

describe('asyncRequest', () => {
    it('should fire promise returning function and receive data', async () => {

        const changes = jest.fn();

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

        autorun(() => {
            changes(toJS(placeStore.read('one')));
        });

        placeStore.request('one');

        await promise.current;

        expect(mocked(changes)).toHaveBeenCalledTimes(3);
        expect(mocked(changes).mock.calls[0][0]).toBe(undefined);
        expect(mocked(changes).mock.calls[1][0].loading).toBe(true);
        expect(mocked(changes).mock.calls[2][0].data).toEqual({
            id: 'a',
            name: `data for one`
        });
    });

    it('should fire promise returning function and receive error', async () => {

        const changes = jest.fn();

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

        autorun(() => {
            changes(toJS(placeStore.read('one')));
        });

        placeStore.request('one');

        try {
            await promise.current;
            // eslint-disable-next-line no-empty
        } catch(e) {}

        expect(mocked(changes)).toHaveBeenCalledTimes(3);
        expect(mocked(changes).mock.calls[0][0]).toBe(undefined);
        expect(mocked(changes).mock.calls[1][0].loading).toBe(true);
        expect(mocked(changes).mock.calls[2][0].error).toBe('ARGH!');
    });
});
