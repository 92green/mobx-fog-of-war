import { autorun } from 'mobx';
import {StoreItem, MergedStoreItem} from '../src/index';

const empty = new StoreItem<number,string>();

const loading = new StoreItem<number,string>();
loading.loading = true;

const error = new StoreItem<number,string>();
error.hasError = true;
error.error = 'error!';

const data = new StoreItem<number,string>();
data.hasData = true;
data.data = 123;

const dataString = new StoreItem<string,string>();
dataString.hasData = true;
dataString.data = "123";

describe('MergedStoreItem', () => {

    it('should pass through multiple items', () => {
        const merged = new MergedStoreItem({
            storeItems: [empty, error, data, loading],
            mergeData: stores => stores.map(store => store.data),
            mergeError: stores => stores.map(store => store.error)
        });

        expect(merged.data).toEqual([empty.data, error.data, data.data, loading.data]);
        expect(merged.error).toEqual([empty.error, error.error, data.error, loading.error]);
    });

    it('should use custom mappers', () => {
        const merged = new MergedStoreItem({
            storeItems: [empty, error, data, loading],
            mergeData: stores => stores.reduce((str, store) => `${str},${store.data}`, ''),
            mergeError: stores => stores.find(store => store.error)?.error
        });

        expect(merged.data).toEqual(`,undefined,undefined,123,undefined`);
        expect(merged.error).toEqual(error.error);
    });

    it('should derive mobx changes from source storeitems', () => {

        const dataString = new StoreItem<string,string>();
        dataString.hasData = true;
        dataString.data = "123";

        const merged = new MergedStoreItem({
            storeItems: [dataString],
            mergeData: stores => stores.reduce((str, store) => `${str},${store.data}`, ''),
            mergeError: stores => stores.find(store => store.error)?.error
        });

        const ran = jest.fn();
        autorun(() => ran(merged.data));

        expect(ran).toHaveBeenCalledTimes(1);
        expect(ran.mock.calls[0][0]).toBe(",123");

        dataString.data = "456";
        expect(ran).toHaveBeenCalledTimes(2);
        expect(ran.mock.calls[1][0]).toBe(",456");
    });

    it('should have promise() / await()', async () => {

        const dataString = new StoreItem<string,string>();
        dataString.loading = true;

        const merged = new MergedStoreItem({
            storeItems: [dataString],
            mergeData: stores => stores.reduce((str, store) => `${str},${store.data}`, ''),
            mergeError: stores => stores.find(store => store.error)?.error
        });

        const promise = merged.await();

        dataString.data = "123";
        dataString.hasData = true;
        dataString.loading = false;
        const resolved = await promise;

        expect(resolved).toBe(",123");
    });
});
