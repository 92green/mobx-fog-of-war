import {Store, rxRequest} from '../src/index';
import {mergeMap} from 'rxjs/operators';
import {mocked} from 'ts-jest/utils';
import {autorun, toJS} from 'mobx';

describe('rxRequest', () => {
    it('should stream changes through observable and receive data', async () => {

        const changes = jest.fn();

        const placeStore = new Store<number,string,string>({
            request: rxRequest(
                mergeMap(async (args: number) => {
                    await Promise.resolve();
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

        // resolve all promises so that data is returned from mergeMap()
        await Promise.resolve();
        await Promise.resolve();

        expect(mocked(changes)).toHaveBeenCalledTimes(3);
        expect(mocked(changes).mock.calls[0][0].loading).toBe(false);
        expect(mocked(changes).mock.calls[1][0].loading).toBe(true);
        expect(mocked(changes).mock.calls[2][0].loading).toBe(false);
        expect(mocked(changes).mock.calls[2][0].data).toBe('data for 1');

        placeStore.request(1);

        // resolve all promises so that data is returned from mergeMap()
        await Promise.resolve();
        await Promise.resolve();

        expect(mocked(changes)).toHaveBeenCalledTimes(5);
        expect(mocked(changes).mock.calls[3][0].loading).toBe(true);
        expect(mocked(changes).mock.calls[4][0].loading).toBe(false);
        expect(mocked(changes).mock.calls[4][0].data).toBe('data for 1');
    });

    it('should stream changes through observable and receive error', async () => {

        const changes = jest.fn();

        const placeStore = new Store<number,string,string>({
            request: rxRequest(
                mergeMap(async (args: number) => {
                    await Promise.resolve();
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

        // resolve all promises so that data is returned from mergeMap()
        await Promise.resolve();
        await Promise.resolve();

        expect(mocked(changes)).toHaveBeenCalledTimes(3);
        expect(mocked(changes).mock.calls[0][0].loading).toBe(false);
        expect(mocked(changes).mock.calls[1][0].loading).toBe(true);
        expect(mocked(changes).mock.calls[2][0].loading).toBe(false);
        expect(mocked(changes).mock.calls[2][0].error).toBe('ARGH!');
    });
});
