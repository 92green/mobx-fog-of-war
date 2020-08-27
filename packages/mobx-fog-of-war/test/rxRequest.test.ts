import {Store, rxRequest} from '../src/index';
import {map} from 'rxjs/operators';
import {mocked} from 'ts-jest/utils';

describe('rxRequest', () => {
    it('should stream changes through observable and receive data', () => {

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

        placeStore.receive = jest.fn();
        placeStore.request(1);

        expect(mocked(placeStore.receive)).toHaveBeenCalledTimes(1);
        expect(mocked(placeStore.receive).mock.calls[0][0]).toEqual({
            args: 1,
            data: 'data for 1'
        });

        placeStore.request(1);
        expect(mocked(placeStore.receive)).toHaveBeenCalledTimes(2);
    });

    it('should stream changes through observable and receive error', () => {

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

        placeStore.receive = jest.fn();
        placeStore.request(1);

        expect(mocked(placeStore.receive)).toHaveBeenCalledTimes(1);
        expect(mocked(placeStore.receive).mock.calls[0][0]).toEqual({
            args: 1,
            error: 'ARGH!'
        });
    });
});
