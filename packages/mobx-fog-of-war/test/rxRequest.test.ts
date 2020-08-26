import {Store, rxRequest} from '../src/index';
import {map} from 'rxjs/operators';
import {mocked} from 'ts-jest/utils';

interface Place {
    id: string;
    name: string;
}

type PlaceArgs = string;

describe('rxRequest', () => {
    it('should stream changes through observable and receive data', () => {

        const placeStore = new Store<PlaceArgs,Place,string>({
            request: rxRequest(
                map((args: PlaceArgs) => {
                    return {
                        args,
                        data: `data for ${args}`
                    };
                })
            )
        });

        placeStore.receive = jest.fn();
        placeStore.request('one');

        expect(mocked(placeStore.receive)).toHaveBeenCalledTimes(1);
        expect(mocked(placeStore.receive).mock.calls[0][0]).toEqual({
            args: 'one',
            data: 'data for one'
        });

        placeStore.request('one');
        expect(mocked(placeStore.receive)).toHaveBeenCalledTimes(2);
    });

    it('should stream changes through observable and receive error', () => {

        const placeStore = new Store<PlaceArgs,Place,string>({
            request: rxRequest(
                map((args: PlaceArgs) => {
                    return {
                        args,
                        error: 'ARGH!'
                    };
                })
            )
        });

        placeStore.receive = jest.fn();
        placeStore.request('one');

        expect(mocked(placeStore.receive)).toHaveBeenCalledTimes(1);
        expect(mocked(placeStore.receive).mock.calls[0][0]).toEqual({
            args: 'one',
            error: 'ARGH!'
        });
    });
});
