import {Store, rxRequest} from '../src/index';
import {map} from 'rxjs/operators';
import {mocked} from 'ts-jest/utils';
import {autorun, toJS} from 'mobx';

describe('rxRequest', () => {
    it('should stream changes through observable and receive data', () => {

        const changes = jest.fn();

        const placeStore = new Store<number,string,string>({
            request: rxRequest(
                map((args: number) => {
                    return {
                        args,
                        data: `data for ${args}`
                    };
                })
            )
        });

        autorun(() => {
            changes(toJS(placeStore.read(1)));
        });

        placeStore.request(1);

        expect(mocked(changes)).toHaveBeenCalledTimes(3);
        expect(mocked(changes).mock.calls[0][0]).toBe(undefined);
        expect(mocked(changes).mock.calls[1][0].loading).toBe(true);
        expect(mocked(changes).mock.calls[2][0].data).toBe('data for 1');

        placeStore.request(1);

        expect(mocked(changes)).toHaveBeenCalledTimes(5);
        expect(mocked(changes).mock.calls[3][0].loading).toBe(true);
        expect(mocked(changes).mock.calls[4][0].data).toBe('data for 1');
    });

    it('should stream changes through observable and receive error', () => {

        const changes = jest.fn();

        const placeStore = new Store<number,string,string>({
            request: rxRequest(
                map((args: number) => {
                    return {
                        args,
                        error: 'ARGH!'
                    };
                })
            )
        });

        autorun(() => {
            changes(toJS(placeStore.read(1)));
        });

        placeStore.request(1);

        expect(mocked(changes)).toHaveBeenCalledTimes(3);
        expect(mocked(changes).mock.calls[0][0]).toBe(undefined);
        expect(mocked(changes).mock.calls[1][0].loading).toBe(true);
        expect(mocked(changes).mock.calls[2][0].error).toBe('ARGH!');
    });
});
