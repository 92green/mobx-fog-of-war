import {Store, StoreItem, argsToKey} from '../src/index';
import {mocked} from 'ts-jest/utils';
import React from 'react';

import {useEffectVariadic} from '../src/useEffectVariadic';
jest.mock('../src/useEffectVariadic');

const setNow = (ms: number): number => {
    ms = Math.floor(ms);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Date.now = jest.spyOn(Date, 'now').mockImplementation(() => ms);
    return ms;
};

afterEach(() => {
    jest.clearAllMocks();
});

describe('Store', () => {

    describe('name', () => {
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

    describe('storeoptions request', () => {
        it('should call the request function passing itself', () => {
            const request = jest.fn();
            const store = new Store<number,string,string>({request});

            expect(request).toHaveBeenCalledTimes(1);
            expect(request.mock.calls[0][0]).toBe(store);
        });
    });

    describe('setLoading', () => {
        it('should read data and set loading', () => {
            const store = new Store<number,string,string>();
            const now = setNow(Math.random() * 10000);

            const item = store.read(1);

            expect(item.loading).toBe(false);

            store.setLoading(1, true);

            const item2 = store.read(1);

            expect(item2.loading).toBe(true);
            expect(item2.hasData).toBe(false); // should not have changed
            expect(item2.data).toBe(undefined); // should not have changed
            expect(item2.hasError).toBe(false); // should not have changed
            expect(item2.error).toBe(undefined); // should not have changed
            expect(item2.time.getTime()).toBe(now);
        });
    });

    describe('setData', () => {
        it('should set data', () => {
            const store = new Store<number,string,string>();
            const now = setNow(Math.random() * 10000);

            store.setData(1, 'one');

            const item = store.read(1);

            expect(item.loading).toBe(false);
            expect(item.hasData).toBe(true);
            expect(item.data).toBe('one');
            expect(item.hasError).toBe(false); // should not have changed
            expect(item.error).toBe(undefined); // should not have changed
            expect(item.time.getTime()).toBe(now);
        });

        it('should be able to handle deep keys', () => {
            const store = new Store<unknown,string,string>();

            store.setData({foo:[1,2,3]}, 'deep');
            const item = store.read({foo:[1,2,3]});

            expect(item.data).toBe('deep');
        });

        it('should treat undefined as "no data exists" and remove the item from cache', () => {
            const store = new Store<unknown,string,string>();

            store.setData(1, 'one');
            store.setData(1, undefined);
            const item = store.read(1);
            expect(item.hasData).toBe(false);
            expect(item.hasError).toBe(false);
            expect(item.data).toBe(undefined);
        });
    });

    describe('setError', () => {
        it('should set error', () => {
            const store = new Store<number,string,string>();
            const now = setNow(Math.random() * 10000);

            store.setError(1, 'error');

            const item = store.read(1);

            expect(item.loading).toBe(false);
            expect(item.hasData).toBe(false); // should not have changed
            expect(item.data).toBe(undefined); // should not have changed
            expect(item.hasError).toBe(true);
            expect(item.error).toBe('error');
            expect(item.time.getTime()).toBe(now);
        });

        it('should not accept undefined', () => {
            const store = new Store<unknown,string,string>();

            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            expect(() => store.setError(1, undefined)).toThrow('Error cannot be undefined');
        });
    });

    describe('set<Thing> combinations', () => {
        it('setLoading then setData', () => {
            const store = new Store<number,string,string>();
            const now = setNow(Math.random() * 10000);

            store.setLoading(1, true);
            store.setData(1, 'one');

            const item = store.read(1);

            expect(item.loading).toBe(false);
            expect(item.hasData).toBe(true);
            expect(item.data).toBe('one');
            expect(item.hasError).toBe(false); // should not have changed
            expect(item.error).toBe(undefined); // should not have changed
            expect(item.time.getTime()).toBe(now);
        });

        it('setLoading then setError', () => {
            const store = new Store<number,string,string>();
            const now = setNow(Math.random() * 10000);

            store.setLoading(1, true);
            store.setError(1, 'error');

            const item = store.read(1);

            expect(item.loading).toBe(false);
            expect(item.hasData).toBe(false); // should not have changed
            expect(item.data).toBe(undefined); // should not have changed
            expect(item.hasError).toBe(true);
            expect(item.error).toBe('error');
            expect(item.time.getTime()).toBe(now);
        });

        it('setData then setLoading', () => {
            const store = new Store<number,string,string>();
            const now = setNow(Math.random() * 10000);

            store.setData(1, 'one');
            store.setLoading(1, true);

            const item = store.read(1);

            expect(item.loading).toBe(true);
            expect(item.hasData).toBe(true); // should not have changed since setData()
            expect(item.data).toBe('one'); // should not have changed since setData()
            expect(item.hasError).toBe(false); // should not have changed
            expect(item.error).toBe(undefined); // should not have changed
            expect(item.time.getTime()).toBe(now);
        });

        it('setError then setLoading', () => {
            const store = new Store<number,string,string>();
            const now = setNow(Math.random() * 10000);

            store.setError(1, 'error');
            store.setLoading(1, true);

            const item = store.read(1);

            expect(item.loading).toBe(true);
            expect(item.hasData).toBe(false); // should not have changed
            expect(item.data).toBe(undefined); // should not have changed
            expect(item.hasError).toBe(true); // should not have changed since setError()
            expect(item.error).toBe('error'); // should not have changed since setError()
            expect(item.time.getTime()).toBe(now);
        });

        it('setError then setData', () => {
            const store = new Store<number,string,string>();
            const now = setNow(Math.random() * 10000);

            store.setError(1, 'error');
            store.setData(1, 'one');

            const item = store.read(1);

            expect(item.loading).toBe(false);
            expect(item.hasData).toBe(true);
            expect(item.data).toBe('one');
            expect(item.hasError).toBe(false); // should have removed error!
            expect(item.error).toBe(undefined); // should have removed error!
            expect(item.time.getTime()).toBe(now);
        });

        it('setData then setError', () => {
            const store = new Store<number,string,string>();
            const now = setNow(Math.random() * 10000);

            store.setData(1, 'one');
            store.setError(1, 'error');

            const item = store.read(1);

            expect(item.loading).toBe(false);
            expect(item.hasData).toBe(true); // should not have changed since setData()
            expect(item.data).toBe('one'); // should not have changed since setData()
            expect(item.hasError).toBe(true);
            expect(item.error).toBe('error');
            expect(item.time.getTime()).toBe(now);
        });
    });

    describe('receive', () => {
        it('should call setData if given data', () => {
            const store = new Store<number,string,string>();
            store.setData = jest.fn();
            store.setError = jest.fn();

            store.receive({args: 1, data: 'one'});

            expect(mocked(store.setData)).toHaveBeenCalledTimes(1);
            expect(mocked(store.setError)).toHaveBeenCalledTimes(0);

            expect(mocked(store.setData).mock.calls[0][0]).toBe(1);
            expect(mocked(store.setData).mock.calls[0][1]).toBe('one');
        });

        it('should call setError if given error', () => {
            const store = new Store<number,string,string>();
            store.setData = jest.fn();
            store.setError = jest.fn();

            store.receive({args: 1, error: 'error'});

            expect(mocked(store.setData)).toHaveBeenCalledTimes(0);
            expect(mocked(store.setError)).toHaveBeenCalledTimes(1);

            expect(mocked(store.setError).mock.calls[0][0]).toBe(1);
            expect(mocked(store.setError).mock.calls[0][1]).toBe('error');
        });
    });

    describe('remove', () => {
        it('should remove data from cache', () => {
            const store = new Store<number,string,string>();

            store.setData(1, 'one');
            store.remove(1);
            const item = store.read(1);
            expect(item.data).toBe(undefined);
        });
    });

    describe('removeByAlias', () => {
        it('should remove data from cache by an alias', () => {
            const store = new Store<number,string,string>();

            store.setData(1, 'one');
            store.setAlias(1, 'alias1');
            store.removeByAlias('alias1');

            expect(store.read(1).data).toBe(undefined);
            expect(store.readAlias('alias1').data).toBe(undefined);
        });

        it('should try and remove data from cache even if alias doesnt exist', () => {
            const store = new Store<number,string,string>();

            store.setData(1, 'one');
            store.removeByAlias('alias1');

            expect(store.read(1).data).toBe('one');
        });
    });

    describe('get() and request()', () => {
        it('should get an item from cache, and fire request()', () => {
            const requestInner = jest.fn();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const request = jest.fn((_store) => requestInner);
            const store = new Store<number,string,string>({request});
            store.request = jest.fn(store.request);

            const item = store.get(1);

            expect(item.loading).toBe(true);

            expect(mocked(store.request)).toHaveBeenCalledTimes(1);
            expect(mocked(store.request).mock.calls[0][0]).toBe(1);

            expect(mocked(request)).toHaveBeenCalledTimes(1);
            expect(mocked(request).mock.calls[0][0]).toBe(store);
            expect(mocked(requestInner)).toHaveBeenCalledTimes(1);
            expect(mocked(requestInner).mock.calls[0][0]).toBe(1);

        });

        it('should not request() twice if already requested', () => {
            const store = new Store<number,string,string>();
            store.request = jest.fn(store.request);

            store.get(1);
            store.get(1);
            store.get(1);

            expect(mocked(store.request)).toHaveBeenCalledTimes(1);
            expect(mocked(store.request).mock.calls[0][0]).toBe(1);
        });

        it('should not request() if args is undefined', () => {
            const store = new Store<number,string,string>();
            store.request = jest.fn(store.request);

            const item = store.get(undefined);

            expect(item.loading).toBe(false);
            expect(item.hasData).toBe(false);

            expect(mocked(store.request)).toHaveBeenCalledTimes(0);
        });

        it('by default, should not request() again even if data was received', () => {
            const store = new Store<number,string,string>();
            store.request = jest.fn(store.request);

            store.get(1);
            store.setData(1, 'one');
            store.get(1);

            expect(mocked(store.request)).toHaveBeenCalledTimes(1);
            expect(mocked(store.request).mock.calls[0][0]).toBe(1);
        });

        it('if staleTime = 0 is set via StoreOptions, should request() again once data was received', () => {
            const requestInner = jest.fn();

            const store = new Store<number,string,string>({
                request: () => requestInner,
                staleTime: 0
            });

            store.request = jest.fn(store.request);

            store.get(1);
            store.setData(1, 'one');
            store.get(1);

            expect(mocked(store.request)).toHaveBeenCalledTimes(2);
            expect(mocked(store.request).mock.calls[0][0]).toBe(1);

            expect(mocked(requestInner)).toHaveBeenCalledTimes(2);
        });

        it('if staleTime = 0 is set via GetOptions, should request() again once data was received', () => {
            const requestInner = jest.fn();

            const store = new Store<number,string,string>({
                request: () => requestInner
            });

            store.request = jest.fn(store.request);

            store.get(1, {staleTime: 0});
            store.setData(1, 'one');
            store.get(1, {staleTime: 0});

            expect(mocked(store.request)).toHaveBeenCalledTimes(2);
            expect(mocked(store.request).mock.calls[0][0]).toBe(1);

            expect(mocked(requestInner)).toHaveBeenCalledTimes(2);
        });

        it('if staleTime = number is set via StoreOptions, should request() again after cached item is older than staleTime', () => {

            setNow(0);
            const requestInner = jest.fn();

            const store = new Store<number,string,string>({
                staleTime: 1,
                request: () => requestInner
            });

            store.request = jest.fn(store.request);

            store.get(1);
            store.setData(1, 'one');
            expect(mocked(store.request)).toHaveBeenCalledTimes(1);

            setNow(300);
            store.get(1);
            expect(mocked(store.request)).toHaveBeenCalledTimes(1);

            setNow(800);
            store.get(1);
            expect(mocked(store.request)).toHaveBeenCalledTimes(1);

            setNow(1200);
            store.get(1);
            expect(mocked(store.request)).toHaveBeenCalledTimes(2);

            expect(mocked(store.request)).toHaveBeenCalledTimes(2);
            expect(mocked(store.request).mock.calls[0][0]).toBe(1);

            expect(mocked(requestInner)).toHaveBeenCalledTimes(2);
        });

        it('if staleTime = number is set via GetOptions, should request() again after cached item is older than staleTime', () => {

            setNow(0);
            const requestInner = jest.fn();

            const store = new Store<number,string,string>({
                request: () => requestInner
            });

            store.request = jest.fn(store.request);

            store.get(1, {staleTime: 1});
            store.setData(1, 'one');
            expect(mocked(store.request)).toHaveBeenCalledTimes(1);

            setNow(300);
            store.get(1, {staleTime: 1});
            expect(mocked(store.request)).toHaveBeenCalledTimes(1);

            setNow(800);
            store.get(1, {staleTime: 1});
            expect(mocked(store.request)).toHaveBeenCalledTimes(1);

            setNow(1200);
            store.get(1, {staleTime: 1});
            expect(mocked(store.request)).toHaveBeenCalledTimes(2);

            expect(mocked(store.request)).toHaveBeenCalledTimes(2);
            expect(mocked(store.request).mock.calls[0][0]).toBe(1);
            expect(mocked(requestInner)).toHaveBeenCalledTimes(2);
        });

        it('request() should always request', () => {
            const requestInner = jest.fn();
            const store = new Store<number,string,string>({
                request: () => requestInner
            });

            const item = store.request(1);
            store.request(1);
            store.request(1);

            expect(mocked(requestInner)).toHaveBeenCalledTimes(3);
            expect(item.loading).toBe(true);
        });
    });

    describe('StoreItem aliases', () => {
        it('should set an alias, and readAlias from that alias', () => {
            const store = new Store<number,string,string,string>();
            store.request = jest.fn(store.request);

            store.setData(1, 'hello');
            store.setData(2, 'hello?');
            store.setAlias(1, 'foo');

            expect(store.read(1).data).toBe('hello');
            expect(store.readAlias('foo').data).toBe('hello');

            store.setAlias(2, 'foo');
            expect(store.readAlias('foo').data).toBe('hello?');
        });

        it('should get() using an alias, and readAlias from that alias', () => {
            const store = new Store<number,string,string,string>();
            store.request = jest.fn(store.request);

            store.get(1, {alias: 'foo'});
            store.setData(1, 'hello');
            store.setData(2, 'hello?');

            expect(store.read(1).data).toBe('hello');
            expect(store.readAlias('foo').data).toBe('hello');

            store.get(2, {alias: 'foo'});
            expect(store.readAlias('foo').data).toBe('hello?');
        });

        it('should request() using an alias, and readAlias from that alias', () => {
            const store = new Store<number,string,string,string>();
            store.request = jest.fn(store.request);

            expect(store.readAlias('foo').data).toBe(undefined);

            store.request(1, {alias: 'foo'});
            store.setData(1, 'hello');
            store.setData(2, 'hello?');

            expect(store.read(1).data).toBe('hello');
            expect(store.readAlias('foo').data).toBe('hello');

            store.request(2, {alias: 'foo'});
            expect(store.readAlias('foo').data).toBe('hello?');
        });
    });

    describe('StoreItem.promise()', () => {

        it('should turn the observable item returned from a new request() into a pending promise', async () => {
            const store = new Store<number,string,string>();

            setTimeout(() => {
                store.setData(1, 'hello');
            }, 1000);

            const result = await store.request(1).promise();

            expect(result.loading).toBe(false);
            expect(result.data).toBe('hello');
        });

        it('should turn the observable item returned from a new request() into a pending promise and resolve on error', async () => {
            const store = new Store<number,string,string>();

            setTimeout(() => {
                store.setError(1, 'error');
            }, 1000);

            const result = await store.request(1).promise();

            expect(result.loading).toBe(false);
            expect(result.error).toBe('error');
        });

        it('should turn the observable item returned from an existing get() into a resolved promise', async () => {
            const store = new Store<number,string,string>();

            store.setData(1, 'hello');
            const item = store.read(1);
            const result = await item.promise();
            expect(result).toBe(store.read(1));
        });

        it('should turn the observable item returned from an existing get() into a resolved promise even on error', async () => {
            const store = new Store<number,string,string>();

            store.setError(1, 'error');
            const item = store.read(1);
            const result = await item.promise();
            expect(result).toBe(store.read(1));
        });
    });

    describe('StoreItem.await()', () => {

        it('should turn the observable item returned from a new request() into a pending promise', async () => {
            const store = new Store<number,string,string>();

            setTimeout(() => {
                store.setData(1, 'hello');
            }, 1000);

            const result = await store.request(1).await();
            expect(result).toBe('hello');
        });

        it('should turn the observable item returned from a new request() into a pending promise and throw on error', async () => {
            expect.assertions(1);

            const store = new Store<number,string,string>();

            setTimeout(() => {
                store.setError(1, 'error');
            }, 1000);

            try {
                await store.request(1).await();
            } catch(e) {
                expect(e).toBe('error');
            }
        });

        it('should turn the observable item returned from an existing get() into a resolved promise', async () => {
            const store = new Store<number,string,string>();

            store.setData(1, 'hello');
            const item = store.read(1);
            const result = await item.await();
            expect(result).toBe(store.read(1).data);
        });
    });

    describe('StoreItem.tuple()', () => {

        it('should turn the store item into a duple for easy destructuring', async () => {
            const store = new Store<number,string,string>();
            store.setData(1, 'hello');
            const storeItem = store.read(1);
            const [data, item] = store.read(1).tuple();

            expect(data).toBe(storeItem.data);
            expect(item).toBe(storeItem);
        });
    });

    describe('useGet', () => {

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        jest.spyOn(React, "useEffect").mockImplementation(() => {});

        it('should call useEffect() and return read()', () => {
            const store = new Store<number,string,string>();
            store.get = jest.fn();

            const storeItem = store.useGet(1);
            const key1 = argsToKey(1);

            expect(mocked(React.useEffect)).toHaveBeenCalledTimes(1);
            expect(mocked(React.useEffect).mock.calls[0][1]).toEqual([key1]);
            mocked(React.useEffect).mock.calls[0][0]();

            expect(mocked(store.get)).toHaveBeenCalledTimes(1);
            expect(mocked(store.get).mock.calls[0][0]).toBe(1);
            expect(mocked(store.get).mock.calls[0][1]).toEqual({});

            expect(storeItem instanceof StoreItem).toBe(true);
        });

        it('should call get() with options', () => {
            const store = new Store<number,string,string>();
            store.get = jest.fn();

            store.useGet(2, {staleTime: 1, dependencies: ['foo']});
            const key2 = argsToKey(2);

            expect(mocked(React.useEffect)).toHaveBeenCalledTimes(1);
            expect(mocked(React.useEffect).mock.calls[0][1]).toEqual([key2, 'foo']);
            mocked(React.useEffect).mock.calls[0][0]();

            expect(mocked(store.get)).toHaveBeenCalledTimes(1);
            expect(mocked(store.get).mock.calls[0][0]).toBe(2);
            expect(mocked(store.get).mock.calls[0][1]).toEqual({staleTime: 1});
        });
    });

    describe('useBatchGet', () => {

        it('should call useEffect() and return read()[]', () => {
            const store = new Store<number,string,string>();
            store.get = jest.fn();

            const items = store.useBatchGet([1,2,3]);
            const keys = [1,2,3].map(n => argsToKey(n));

            expect(mocked(useEffectVariadic)).toHaveBeenCalledTimes(1);
            expect(mocked(useEffectVariadic).mock.calls[0][1]).toEqual(keys);
            mocked(useEffectVariadic).mock.calls[0][0]();

            expect(mocked(store.get)).toHaveBeenCalledTimes(3);
            expect(mocked(store.get).mock.calls[0][0]).toBe(1);
            expect(mocked(store.get).mock.calls[1][0]).toBe(2);
            expect(mocked(store.get).mock.calls[2][0]).toBe(3);
            expect(mocked(store.get).mock.calls[0][1]).toEqual({});
            expect(mocked(store.get).mock.calls[1][1]).toEqual({});
            expect(mocked(store.get).mock.calls[2][1]).toEqual({});

            expect(items[0] instanceof StoreItem).toBe(true);
            expect(items[1] instanceof StoreItem).toBe(true);
            expect(items[2] instanceof StoreItem).toBe(true);
        });

        it('should still call useEffect() if called with undefined', () => {
            const store = new Store<number,string,string>();
            store.get = jest.fn();

            const items = store.useBatchGet(undefined);
            expect(items).toEqual([]);
            expect(mocked(useEffectVariadic)).toHaveBeenCalledTimes(1);
            expect(mocked(store.get)).toHaveBeenCalledTimes(0);
        });

        it('should call get() with options', () => {
            const store = new Store<number,string,string>();
            store.get = jest.fn();

            store.useBatchGet([2], {staleTime: 1, dependencies: ['foo']});
            const key2 = argsToKey(2);

            expect(mocked(useEffectVariadic)).toHaveBeenCalledTimes(1);
            expect(mocked(useEffectVariadic).mock.calls[0][1]).toEqual([key2, 'foo']);
            mocked(mocked(useEffectVariadic)).mock.calls[0][0]();

            expect(mocked(store.get)).toHaveBeenCalledTimes(1);
            expect(mocked(store.get).mock.calls[0][0]).toBe(2);
            expect(mocked(store.get).mock.calls[0][1]).toEqual({staleTime: 1});
        });
    });

    describe('useGetMany', () => {

        it('should call useEffect() and return read()[]', () => {
            const store = new Store<number,string,string>();
            store.get = jest.fn();

            const item = store.useGetMany([1,2,3]);
            const keys = [1,2,3].map(n => argsToKey(n));

            expect(mocked(useEffectVariadic)).toHaveBeenCalledTimes(1);
            expect(mocked(useEffectVariadic).mock.calls[0][1]).toEqual(keys);
            mocked(useEffectVariadic).mock.calls[0][0]();

            expect(mocked(store.get)).toHaveBeenCalledTimes(3);
            expect(mocked(store.get).mock.calls[0][0]).toBe(1);
            expect(mocked(store.get).mock.calls[1][0]).toBe(2);
            expect(mocked(store.get).mock.calls[2][0]).toBe(3);
            expect(mocked(store.get).mock.calls[0][1]).toEqual({});
            expect(mocked(store.get).mock.calls[1][1]).toEqual({});
            expect(mocked(store.get).mock.calls[2][1]).toEqual({});

            expect(item instanceof StoreItem).toBe(true);
        });

        it('should accept empty array and return hasData = true', () => {
            const store = new Store<number,string,string>();
            store.get = jest.fn();

            const item = store.useGetMany([]);
            expect(mocked(useEffectVariadic)).toHaveBeenCalledTimes(1);

            expect(item instanceof StoreItem).toBe(true);
            expect(item.loading).toBe(false);
            expect(item.hasData).toBe(true);
            expect(item.hasError).toBe(false);
        });

        it('should return blank store item if called with undefined', () => {
            const store = new Store<number,string,string>();
            store.get = jest.fn();

            const item = store.useGetMany(undefined);
            expect(item instanceof StoreItem).toBe(true);
            expect(item.loading).toBe(false);
            expect(item.hasData).toBe(false);
            expect(item.hasError).toBe(false);
        });

        it('should call get() with options', () => {
            const store = new Store<number,string,string>();
            store.get = jest.fn();

            store.useGetMany([2], {staleTime: 1, dependencies: ['foo']});
            const key2 = argsToKey(2);

            expect(mocked(useEffectVariadic)).toHaveBeenCalledTimes(1);
            expect(mocked(useEffectVariadic).mock.calls[0][1]).toEqual([key2, 'foo']);
            mocked(mocked(useEffectVariadic)).mock.calls[0][0]();

            expect(mocked(store.get)).toHaveBeenCalledTimes(1);
            expect(mocked(store.get).mock.calls[0][0]).toBe(2);
            expect(mocked(store.get).mock.calls[0][1]).toEqual({staleTime: 1});
        });
    });
});

