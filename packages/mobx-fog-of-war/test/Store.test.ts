import {Store, StoreItem} from '../src/index';
import {mocked} from 'ts-jest/utils';
import React from 'react';

const setNow = (ms: number): number => {
    ms = Math.floor(ms);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Date.now = jest.spyOn(Date, 'now').mockImplementation(() => ms);
    return ms;
};

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

            expect(item).toBe(undefined);

            store.setLoading(1, true);

            const item2 = store.read(1) as StoreItem<string,string>;

            expect(item2 instanceof StoreItem).toBe(true);
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

            const item = store.read(1) as StoreItem<string,string>;

            expect(item instanceof StoreItem).toBe(true);
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
            const item = store.read({foo:[1,2,3]}) as StoreItem<string,string>;

            expect(item instanceof StoreItem).toBe(true);
            expect(item.data).toBe('deep');
        });
    });

    describe('setError', () => {
        it('should set error', () => {
            const store = new Store<number,string,string>();
            const now = setNow(Math.random() * 10000);

            store.setError(1, 'error');

            const item = store.read(1) as StoreItem<string,string>;

            expect(item instanceof StoreItem).toBe(true);
            expect(item.loading).toBe(false);
            expect(item.hasData).toBe(false); // should not have changed
            expect(item.data).toBe(undefined); // should not have changed
            expect(item.hasError).toBe(true);
            expect(item.error).toBe('error');
            expect(item.time.getTime()).toBe(now);
        });
    });

    describe('set<Thing> combinations', () => {
        it('setLoading then setData', () => {
            const store = new Store<number,string,string>();
            const now = setNow(Math.random() * 10000);

            store.setLoading(1, true);
            store.setData(1, 'one');

            const item = store.read(1) as StoreItem<string,string>;

            expect(item instanceof StoreItem).toBe(true);
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

            const item = store.read(1) as StoreItem<string,string>;

            expect(item instanceof StoreItem).toBe(true);
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

            const item = store.read(1) as StoreItem<string,string>;

            expect(item instanceof StoreItem).toBe(true);
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

            const item = store.read(1) as StoreItem<string,string>;

            expect(item instanceof StoreItem).toBe(true);
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

            const item = store.read(1) as StoreItem<string,string>;

            expect(item instanceof StoreItem).toBe(true);
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

            const item = store.read(1) as StoreItem<string,string>;

            expect(item instanceof StoreItem).toBe(true);
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

            const item = store.read(1);
            store.setData(1, 'one');
            store.remove(1);
            expect(item).toBe(undefined);
        });
    });

    describe('get() and request()', () => {
        it('should get an item from cache, and fire request()', () => {
            const store = new Store<number,string,string>();
            store.request = jest.fn(store.request);

            const item = store.get(1) as StoreItem<string,string>;

            expect(item instanceof StoreItem).toBe(true);
            expect(item.loading).toBe(true);

            expect(mocked(store.request)).toHaveBeenCalledTimes(1);
            expect(mocked(store.request).mock.calls[0][0]).toBe(1);

            expect(store.nextRequest && store.nextRequest.args).toBe(1);
            expect(store.nextRequest && store.nextRequest.requestId).toBe(1);
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

        it('by default, should not request() again even if data was received', () => {
            const store = new Store<number,string,string>();
            store.request = jest.fn(store.request);

            store.get(1);
            store.setData(1, 'one');
            store.get(1);

            expect(mocked(store.request)).toHaveBeenCalledTimes(1);
            expect(mocked(store.request).mock.calls[0][0]).toBe(1);
        });

        it('if maxAge = 0 is set via StoreOptions, should request() again once data was received', () => {
            const store = new Store<number,string,string>({
                maxAge: 0
            });

            store.request = jest.fn(store.request);

            store.get(1);
            store.setData(1, 'one');
            store.get(1);

            expect(mocked(store.request)).toHaveBeenCalledTimes(2);
            expect(mocked(store.request).mock.calls[0][0]).toBe(1);
            expect(store.nextRequest && store.nextRequest.requestId).toBe(2);
        });

        it('if maxAge = 0 is set via GetOptions, should request() again once data was received', () => {
            const store = new Store<number,string,string>();

            store.request = jest.fn(store.request);

            store.get(1, {maxAge: 0});
            store.setData(1, 'one');
            store.get(1, {maxAge: 0});

            expect(mocked(store.request)).toHaveBeenCalledTimes(2);
            expect(mocked(store.request).mock.calls[0][0]).toBe(1);
            expect(store.nextRequest && store.nextRequest.requestId).toBe(2);
        });

        it('if maxAge = number is set via StoreOptions, should request() again after cached item is older than maxAge', () => {

            setNow(0);

            const store = new Store<number,string,string>({
                maxAge: 1000
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
            expect(store.nextRequest && store.nextRequest.requestId).toBe(2);
        });

        it('if maxAge = number is set via GetOptions, should request() again after cached item is older than maxAge', () => {

            setNow(0);

            const store = new Store<number,string,string>();

            store.request = jest.fn(store.request);

            store.get(1, {maxAge: 1000});
            store.setData(1, 'one');
            expect(mocked(store.request)).toHaveBeenCalledTimes(1);

            setNow(300);
            store.get(1, {maxAge: 1000});
            expect(mocked(store.request)).toHaveBeenCalledTimes(1);

            setNow(800);
            store.get(1, {maxAge: 1000});
            expect(mocked(store.request)).toHaveBeenCalledTimes(1);

            setNow(1200);
            store.get(1, {maxAge: 1000});
            expect(mocked(store.request)).toHaveBeenCalledTimes(2);

            expect(mocked(store.request)).toHaveBeenCalledTimes(2);
            expect(mocked(store.request).mock.calls[0][0]).toBe(1);
            expect(store.nextRequest && store.nextRequest.requestId).toBe(2);
        });
    });

    describe('useGet', () => {
        it('should call useEffect() and return read()', () => {

            jest.spyOn(React, "useEffect").mockImplementation(() => 123);

            const store = new Store<number,string,string>();
            store.get = jest.fn();

            store.useGet(1, {maxAge: 1000});

            expect(mocked(React.useEffect)).toHaveBeenCalledTimes(1);
            mocked(React.useEffect).mock.calls[0][0]();

            expect(mocked(store.get)).toHaveBeenCalledTimes(1);
            expect(mocked(store.get).mock.calls[0][0]).toBe(1);
            expect(mocked(store.get).mock.calls[0][1]).toEqual({maxAge: 1000});
        });
    });
});

