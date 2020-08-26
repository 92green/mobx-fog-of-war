import {Store, StoreItem} from '../src/index';
import {mocked} from 'ts-jest/utils';

describe('Store', () => {

    describe('.name', () => {
        it('store should have name', () => {
            const store = new Store<number,string,string>({
                name: 'user store'
            });

            expect(store.name).toBe('user store');
        });

        it('store should log with name', () => {
            const logger = jest.fn();

            const store = new Store<number,string,string>({
                name: 'user store',
                log: mocked(logger)
            });

            store.setData(3, 'three');
            expect(mocked(logger)).toHaveBeenCalledTimes(1);
            expect(mocked(logger).mock.calls[0]).toEqual([
                `user store: receiving data for 3:`,
                'three'
            ]);
        });
    });

    describe('setLoading', () => {
        it('should read data and set loading', () => {
            const store = new Store<number,string,string>();

            const item = store.read(1);

            expect(item).toBe(undefined);

            store.setLoading(1, true);

            const item2 = store.read(1) as StoreItem<string,string>;

            expect(item2 instanceof StoreItem).toBe(true);
            expect(item2.loading).toBe(true);
            expect(item2.hasData).toBe(false); // should not have changed
            expect(item2.data).toBe(undefined); // should not have changed
            expect(item2.hasError).toBe(false); // should not have changed
            expect(item2.error).toBe(undefined); // should not have changed
            expect(item2.time instanceof Date).toBe(true);
        });
    });

    describe('setData', () => {
        it('should set data', () => {
            const store = new Store<number,string,string>();

            store.setData(1, 'one');

            const item = store.read(1) as StoreItem<string,string>;

            expect(item instanceof StoreItem).toBe(true);
            expect(item.loading).toBe(false);
            expect(item.hasData).toBe(true);
            expect(item.data).toBe('one');
            expect(item.hasError).toBe(false); // should not have changed
            expect(item.error).toBe(undefined); // should not have changed
            expect(item.time instanceof Date).toBe(true);
        });

        it('should be able to handle deep keys', () => {
            const store = new Store<unknown,string,string>();

            store.setData({foo:[1,2,3]}, 'deep');
            const item = store.read({foo:[1,2,3]}) as StoreItem<string,string>;

            expect(item instanceof StoreItem).toBe(true);
            expect(item.data).toBe('deep');
        });
    });

    describe('setError', () => {
        it('should set error', () => {
            const store = new Store<number,string,string>();

            store.setError(1, 'error');

            const item = store.read(1) as StoreItem<string,string>;

            expect(item instanceof StoreItem).toBe(true);
            expect(item.loading).toBe(false);
            expect(item.hasData).toBe(false); // should not have changed
            expect(item.data).toBe(undefined); // should not have changed
            expect(item.hasError).toBe(true);
            expect(item.error).toBe('error');
            expect(item.time instanceof Date).toBe(true);
        });
    });

    describe('setXYZ combinations', () => {
        it('setLoading then setData', () => {
            const store = new Store<number,string,string>();

            store.setLoading(1, true);
            store.setData(1, 'one');

            const item = store.read(1) as StoreItem<string,string>;

            expect(item instanceof StoreItem).toBe(true);
            expect(item.loading).toBe(false);
            expect(item.hasData).toBe(true);
            expect(item.data).toBe('one');
            expect(item.hasError).toBe(false); // should not have changed
            expect(item.error).toBe(undefined); // should not have changed
            expect(item.time instanceof Date).toBe(true);
        });

        it('setLoading then setError', () => {
            const store = new Store<number,string,string>();

            store.setLoading(1, true);
            store.setError(1, 'error');

            const item = store.read(1) as StoreItem<string,string>;

            expect(item instanceof StoreItem).toBe(true);
            expect(item.loading).toBe(false);
            expect(item.hasData).toBe(false); // should not have changed
            expect(item.data).toBe(undefined); // should not have changed
            expect(item.hasError).toBe(true);
            expect(item.error).toBe('error');
            expect(item.time instanceof Date).toBe(true);
        });

        it('setData then setLoading', () => {
            const store = new Store<number,string,string>();

            store.setData(1, 'one');
            store.setLoading(1, true);

            const item = store.read(1) as StoreItem<string,string>;

            expect(item instanceof StoreItem).toBe(true);
            expect(item.loading).toBe(true);
            expect(item.hasData).toBe(true); // should not have changed since setData()
            expect(item.data).toBe('one'); // should not have changed since setData()
            expect(item.hasError).toBe(false); // should not have changed
            expect(item.error).toBe(undefined); // should not have changed
            expect(item.time instanceof Date).toBe(true);
        });

        it('setError then setLoading', () => {
            const store = new Store<number,string,string>();

            store.setError(1, 'error');
            store.setLoading(1, true);

            const item = store.read(1) as StoreItem<string,string>;

            expect(item instanceof StoreItem).toBe(true);
            expect(item.loading).toBe(true);
            expect(item.hasData).toBe(false); // should not have changed
            expect(item.data).toBe(undefined); // should not have changed
            expect(item.hasError).toBe(true); // should not have changed since setError()
            expect(item.error).toBe('error'); // should not have changed since setError()
            expect(item.time instanceof Date).toBe(true);
        });

        it('setError then setData', () => {
            const store = new Store<number,string,string>();

            store.setError(1, 'error');
            store.setData(1, 'one');

            const item = store.read(1) as StoreItem<string,string>;

            expect(item instanceof StoreItem).toBe(true);
            expect(item.loading).toBe(false);
            expect(item.hasData).toBe(true);
            expect(item.data).toBe('one');
            expect(item.hasError).toBe(false); // should have removed error!
            expect(item.error).toBe(undefined); // should have removed error!
            expect(item.time instanceof Date).toBe(true);
        });

        it('setData then setError', () => {
            const store = new Store<number,string,string>();

            store.setData(1, 'one');
            store.setError(1, 'error');

            const item = store.read(1) as StoreItem<string,string>;

            expect(item instanceof StoreItem).toBe(true);
            expect(item.loading).toBe(false);
            expect(item.hasData).toBe(true); // should not have changed since setData()
            expect(item.data).toBe('one'); // should not have changed since setData()
            expect(item.hasError).toBe(true);
            expect(item.error).toBe('error');
            expect(item.time instanceof Date).toBe(true);
        });
    });

    describe('remove', () => {
        it('should remove data from cache', () => {
            const store = new Store<number,string,string>();

            const item = store.read(1);
            store.setData(1, 'one');
            store.remove(1);
            expect(item).toBe(undefined);
        });
    });
});

