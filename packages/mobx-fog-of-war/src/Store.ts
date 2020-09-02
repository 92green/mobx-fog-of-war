import {observable, action, autorun} from 'mobx';
import {useEffect} from 'react';
import {argsToKey} from './argsToKey';


export class StoreItem<D,E> {
    @observable loading = false;
    @observable hasData = false;
    @observable data: D|undefined;
    @observable hasError = false;
    @observable error: E|undefined;
    @observable time = new Date(Date.now());

    toPromise = (): Promise<StoreItem<D,E>> => {
        if(!this.loading) return Promise.resolve(this);

        let resolver: (() => void)|undefined;
        const promise = new Promise(resolve => {
            resolver = () => void resolve(this);
        });

        autorun(reaction => {
            if(!this.loading) {
                /* istanbul ignore next */
                resolver?.();
                reaction.dispose();
            }
        });

        return promise as Promise<StoreItem<D,E>>;
    };
}

export interface NextRequest<A> {
    args: A;
    requestId: number;
}

export type Receive<A,D,E> = {
    args: A;
    data: D;
} | {
    args: A;
    error: E;
};

export type Logger = (...args: unknown[]) => unknown;

export interface StoreOptions<A,D,E> {
    name?: string;
    request?: (store: Store<A,D,E>) => void;
    staleTime?: number;
    log?: Logger;
}

export interface GetOptions {
    staleTime?: number;
}

export interface UseGetOptions {
    staleTime?: number;
    dependencies?: unknown[];
}

export class Store<A,D,E> {

    name: string;
    staleTime: number;
    log: Logger;

    @observable cache: Map<string, StoreItem<D,E>> = new Map();

    // nextRequest will change each time there is a new request
    // chain off it to go fetch some data
    @observable nextRequest: NextRequest<A>|undefined;
    requestId = 0;

    constructor(options: StoreOptions<A,D,E> = {}) {
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

        if(request) {
            request(this);
        }
    }

    _getOrCreate = (key: string): StoreItem<D,E> => {
        let item = this.cache.get(key);
        if(!item) {
            item = new StoreItem();
            item.time = new Date(Date.now());
            this.cache.set(key, item);
        }
        return item;
    };

    // read()
    //
    // reads an item from cache
    // will NOT go get it from source if it doesnt exist
    //
    // remember that the returned item is a mobx observable
    // so all changes to the item can be observed,
    // or turned into an rxjs observable to be observed that way

    @action
    read = (args: A): StoreItem<D,E> => {
        const key = argsToKey(args);
        return this._getOrCreate(key);
    }

    // get()
    //
    // gets an item, either from cache or by requesting it if required
    // returns the mobx observable for the item

    get = (args: A, options: GetOptions = {}): StoreItem<D,E> => {
        const key = argsToKey(args);

        const item = this.cache.get(key);

        const hasItemExpired = (item: StoreItem<D,E>): boolean => {
            const staleTime: number = typeof options.staleTime === 'number'
                ? options.staleTime
                : this.staleTime;

            if(staleTime === -1) return false;
            if(staleTime === 0) return true;
            return new Date(Date.now()) > new Date(item.time.getTime() + staleTime * 1000);
        };

        if(!item || (!item.loading && (!item.hasData || hasItemExpired(item)))) {
            return this.request(args);
        }

        return this.read(args);
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
    request = (args: A): StoreItem<D,E> => {
        const key = argsToKey(args);

        this.log(`${this.name}: requesting ${key}:`, args);

        this.setLoading(args, true);

        this.requestId++;

        // set nextRequest, inserting a new item into the request stream
        this.nextRequest = {
            args,
            requestId: this.requestId
        };

        return this.read(args);
    };

    // receive() action
    //
    // for a given key, set an item in cache
    // basd on if it is data or error

    @action
    receive = (receive: Receive<A,D,E>): void => {
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
    setData = (args: A, data: D): void => {
        const key = argsToKey(args);
        this.log(`${this.name}: receiving data for ${key}:`, data);

        const item = this._getOrCreate(key);
        item.loading = false;
        item.hasData = true;
        item.hasError = false;
        item.error = undefined;
        item.data = data;
    };

    // setData() action
    //
    // for a given key, set an item's data in cache

    @action
    setError = (args: A, error: E): void => {
        const key = argsToKey(args);
        this.log(`${this.name}: receiving error for ${key}:`, error);

        const item = this._getOrCreate(key);
        item.loading = false;
        item.hasError = true;
        item.error = error;
    };

    // remove() action
    //
    // for a given key, remove the cached item

    @action
    remove = (args: A): void => {
        const key = argsToKey(args);
        this.cache.delete(key);
    };

    // useGet()
    //
    // react hook to get data
    // because React doesn't like side effects during a render
    // call it every render because this'll be deduped upstream anyway

    useGet = (args: A, {staleTime, dependencies = []}: UseGetOptions = {}): StoreItem<D,E>|undefined => {
        const key = argsToKey(args);
        useEffect(() => void this.get(args, {staleTime}), [key, ...dependencies]);
        return this.read(args);
    };
}
