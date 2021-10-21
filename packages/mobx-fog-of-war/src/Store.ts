import {observable, action, autorun} from 'mobx';
import {useEffect} from 'react';
import {argsToKey} from './argsToKey';
import {useEffectVariadic} from './useEffectVariadic';
import {mergeStoreItems} from './mergeStoreItems';

export type StoreItemGetPromise<D,E> = () => Promise<StoreItem<D,E>>;
export type StoreItemGetAwait<D> = () => Promise<D>;
export type StoreItemGetTuple<D,E> = () => StoreItemTuple<D,E>;

export const createStoreItemPromise = <D,E>(storeItem: StoreItem<D,E>) => (): Promise<StoreItem<D,E>> => {
    if(!storeItem.loading) return Promise.resolve(storeItem);

    let resolver: (() => void)|undefined;
    const promise = new Promise(resolve => {
        resolver = () => void resolve(storeItem);
    });

    autorun(reaction => {
        if(!storeItem.loading) {
            /* istanbul ignore next */
            resolver?.();
            reaction.dispose();
        }
    });

    return promise as Promise<StoreItem<D,E>>;
};

export const createStoreItemAwait = <D,E>(storeItem: StoreItem<D,E>) => async (): Promise<D> => {
    await storeItem.promise();
    if(storeItem.hasError || !storeItem.hasData) {
        throw storeItem.error;
    }
    return storeItem.data as D;
};

export const createStoreItemTuple = <D,E>(storeItem: StoreItem<D,E>) => (): StoreItemTuple<D,E> => {
    return [storeItem.data, storeItem];
};

export type StoreItemTuple<D,E> = [
    D|undefined,
    StoreItem<D,E>
];

export class StoreItem<D,E> {
    @observable loading = false;
    @observable data: D|undefined;
    @observable hasData = false;
    @observable hasError = false;
    @observable error: E|undefined;
    @observable time = new Date(Date.now());

    promise: StoreItemGetPromise<D,E> = createStoreItemPromise<D,E>(this);
    await: StoreItemGetAwait<D> = createStoreItemAwait<D,E>(this);
    tuple: StoreItemGetTuple<D,E> = createStoreItemTuple<D,E>(this); // deprecated
}

export type Receive<A,D,E> = {
    args: A;
    data: D;
} | {
    args: A;
    error: E;
};

export type Logger = (...args: unknown[]) => unknown;

export interface StoreOptions<A,D,E,AA> {
    name?: string;
    request?: (store: Store<A,D,E,AA>) => (args: A) => void;
    staleTime?: number;
    log?: Logger;
}

export interface GetOptions<AA> {
    staleTime?: number;
    alias?: AA;
}

export interface RequestOptions<AA> {
    alias?: AA;
}

export interface UseGetOptions<AA> {
    staleTime?: number;
    dependencies?: unknown[];
    alias?: AA;
}

export interface UseGetManyOptions<AA> {
    staleTime?: number;
    dependencies?: unknown[];
    alias?: AA;
    priorities?: string;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type NotUndefined = {} | null;

export class Store<A,D extends NotUndefined,E extends NotUndefined,AA=string> {

    name: string;
    staleTime: number;
    log: Logger;
    requester?: (args: A) => void;

    @observable cache: Map<string, StoreItem<D,E>> = new Map();
    @observable aliases: Map<string, string> = new Map();

    constructor(options: StoreOptions<A,D,E,AA> = {}) {
        const {
            name = 'unnamed',
            request,
            staleTime = -1,
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            log = () => {}
        } = options;

        this.name = name;
        this.log = log;
        this.staleTime = staleTime;

        this.requester = request?.(this);
    }

    @action
    _create = (key: string): StoreItem<D,E> => {
        const item: StoreItem<D,E> = new StoreItem();
        item.time = new Date(Date.now());
        this.cache.set(key, item);
        return item;
    };

    _getOrCreate = (key: string): StoreItem<D,E> => {
        return this.cache.get(key) || this._create(key);
    };

    // read()
    //
    // reads an item from cache
    // will NOT go get it from source if it doesnt exist
    //
    // remember that the returned item is a mobx observable
    // so all changes to the item can be observed,
    // or turned into an rxjs observable to be observed that way

    read = (args: A|undefined): StoreItem<D,E> => {
        const key = argsToKey(args);
        return this._getOrCreate(key);
    }

    // readAlias()
    //
    // reads an item from cache via its alias
    // aliases are set by get(), request() or useGet()
    // an alias always refers to a single item in cache at a time
    // although the item being referred to may change

    readAlias = (args: AA): StoreItem<D,E> => {
        const aliasKey = argsToKey(args);
        const key = this.aliases.get(aliasKey) || '?';
        // ^ if alias not found, a '?' empty storeitem item will be created
        // which will never be updated and is used merely to return from
        // this and any future calls toreadAlias
        return this._getOrCreate(key);
    }

    // get()
    //
    // gets an item, either from cache or by requesting it if required
    // returns a storeitem

    get = (args: A|undefined, options: GetOptions<AA> = {}): StoreItem<D,E> => {
        if('alias' in options) {
            this.setAlias(args, options.alias as AA);
        }

        const item = this.read(args);

        const hasItemExpired = (item: StoreItem<D,E>): boolean => {
            const staleTime: number = typeof options.staleTime === 'number'
                ? options.staleTime
                : this.staleTime;

            if(staleTime === -1) return false;
            if(staleTime === 0) return true;
            return new Date(Date.now()) > new Date(item.time.getTime() + staleTime * 1000);
        };

        if(args !== undefined && !item.loading && (!item.hasData || hasItemExpired(item))) {
            return this.request(args);
        }

        return item;
    }

    //
    // actions
    //
    // the act of calling these will cause mobx to update
    // everything thats interested in the whole app
    //

    // request() action
    //
    // make a request for data

    @action
    request = (args: A, options: RequestOptions<AA> = {}): StoreItem<D,E> => {
        if('alias' in options) {
            this.setAlias(args, options.alias as AA);
        }

        const key = argsToKey(args);

        this.log(`${this.name}: requesting ${key}:`, args);

        this.setLoading(args, true);

        this.requester?.(args);

        return this.read(args);
    };

    // receive() action
    //
    // for a given key, set an item in cache
    // basd on if it is data or error

    @action
    receive = (receive: Receive<A,D|undefined,E>): void => {
        if('error' in receive) {
            this.setError(receive.args, receive.error);
        } else {
            this.setData(receive.args, receive.data);
        }
    };

    // setLoading() action
    //
    // for a given key, set an item's loading state

    @action
    setLoading = (args: A, loading: boolean): void => {
        const key = argsToKey(args);
        const item = this._getOrCreate(key);
        item.loading = loading;
    };

    // setData() action
    //
    // for a given key, set an item's data in cache

    @action
    setData = (args: A, data: D|undefined): void => {
        if(data === undefined) {
            this.remove(args);
            return;
        }

        const key = argsToKey(args);
        this.log(`${this.name}: receiving data for ${key}:`, data);

        const item = this._getOrCreate(key);
        item.loading = false;
        item.hasData = true;
        item.hasError = false;
        item.error = undefined;
        item.data = data;
    };

    // setError() action
    //
    // for a given key, set an item's data in cache

    @action
    setError = (args: A, error: E): void => {
        if(error === undefined) {
            throw new Error('Error cannot be undefined');
        }

        const key = argsToKey(args);
        this.log(`${this.name}: receiving error for ${key}:`, error);

        const item = this._getOrCreate(key);
        item.loading = false;
        item.hasError = error !== undefined;
        item.error = error;
    };

    // setAlias()
    //
    // set an alias for a set of args

    @action
    setAlias = (args: A|undefined, alias: AA): void => {
        const key = argsToKey(args);
        const aliasKey = argsToKey(alias);
        this.aliases.set(aliasKey, key);
    };

    // remove() action
    //
    // for a given key, remove the cached item

    @action
    remove = (args: A): void => {
        const key = argsToKey(args);
        this.cache.delete(key);
    };

    // removeByAlias() action
    //
    // for a given alias, remove the cached item

    @action
    removeByAlias = (args: AA): void => {
        const aliasKey = argsToKey(args);
        const key = this.aliases.get(aliasKey) || '?';
        if(key !== '?') {
            this.cache.delete(key);
        }
    };

    // useGet()
    //
    // react hook to get data
    // because React doesn't like side effects during a render

    useGet = (args: A|undefined, {dependencies = [], ...restOptions}: UseGetOptions<AA> = {}): StoreItem<D,E> => {
        const key = argsToKey(args);

        useEffect(() => {
            this.get(args, restOptions);
        }, [key, ...dependencies]);

        return this.read(args);
    };

    // useBatchGet()
    //
    // react hook to get an array of items
    // because React doesn't like side effects during a render

    useBatchGet = (argsArray: A[]|undefined = [], {dependencies = [], ...restOptions}: UseGetOptions<AA> = {}): StoreItem<D,E>[] => {
        const keys = argsArray.map(args => argsToKey(args));

        useEffectVariadic(() => {
            argsArray.forEach(args => this.get(args, restOptions));
        }, [...keys, ...dependencies]);

        return argsArray.map(args => this.read(args));
    };

    // useGetMany()
    //
    // react hook to get an array of items
    // because React doesn't like side effects during a render

    useGetMany = (argsArray: A[]|undefined, {priorities, ...restOptions}: UseGetManyOptions<AA> = {}): StoreItem<D[],E[]> => {
        const storeItems = this.useBatchGet(argsArray, restOptions);
        return mergeStoreItems(argsArray ? storeItems : undefined, priorities);
    };
}
