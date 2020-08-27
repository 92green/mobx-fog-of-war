import {observable, action} from 'mobx';
import {useEffect} from 'react';
import {argsToKey} from './argsToKey';

export class StoreItem<D,E> {
    @observable loading = false;
    @observable hasData = false;
    @observable data: D|undefined;
    @observable hasError = false;
    @observable error: E|undefined;
    @observable time = new Date(Date.now());
}

export interface NextRequest<Args> {
    args: Args;
    requestId: number;
}

export type Receive<Args,Data,Err> = {
    args: Args;
    data: Data;
} | {
    args: Args;
    error: Err;
};

export type Logger = (...args: unknown[]) => unknown;

export interface StoreOptions<Args,Data,Err> {
    name?: string;
    request?: (store: Store<Args,Data,Err>) => void;
    maxAge?: number;
    log?: Logger;
}

export interface GetOptions {
    maxAge?: number;
}

export class Store<Args,Data,Err> {

    name: string;
    maxAge: number;
    log: Logger;

    @observable cache: Map<string, StoreItem<Data,Err>> = new Map();

    // nextRequest will change each time there is a new request
    // chain off it to go fetch some data
    @observable nextRequest: NextRequest<Args>|undefined;
    requestId = 0;

    constructor(options: StoreOptions<Args,Data,Err> = {}) {
        const {
            name = 'unnamed',
            request,
            maxAge = -1,
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            log = () => {}
        } = options;

        this.name = name;
        this.log = log;
        this.maxAge = maxAge;

        if(request) {
            request(this);
        }
    }

    _getOrCreate = (key: string): StoreItem<Data,Err> => {
        let item = this.cache.get(key);
        if(!item) {
            item = new StoreItem();
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

    read = (args: Args): StoreItem<Data,Err>|undefined => {
        const key = argsToKey(args);
        return this.cache.get(key);
    }

    // get()
    //
    // gets an item, either from cache or by requesting it if required
    // returns the mobx observable for the item

    get = (args: Args, options: GetOptions = {}): StoreItem<Data,Err>|undefined => {
        const key = argsToKey(args);

        const item = this.cache.get(key);

        const hasItemExpired = (item: StoreItem<Data,Err>): boolean => {
            const maxAge: number = typeof options.maxAge === 'number'
                ? options.maxAge
                : this.maxAge;

            if(maxAge === -1) return false;
            if(maxAge === 0) return true;
            return new Date(Date.now()) > new Date(item.time.getTime() + maxAge);
        };

        if(!item || (!item.loading && (!item.hasData || hasItemExpired(item)))) {
            this.request(args);
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
    request = (args: Args): void => {
        const key = argsToKey(args);

        this.log(`${this.name}: requesting ${key}:`, args);

        this.setLoading(args, true);

        this.requestId++;

        // set nextRequest, inserting a new item into the request stream
        this.nextRequest = {
            args,
            requestId: this.requestId
        };
    };

    // receive() action
    //
    // for a given key, set an item in cache
    // basd on if it is data or error

    @action
    receive = (receive: Receive<Args,Data,Err>): void => {
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
    setLoading = (args: Args, loading: boolean): void => {
        const key = argsToKey(args);
        const item = this._getOrCreate(key);
        item.loading = loading;
        item.time = new Date(Date.now());
    };

    // setData() action
    //
    // for a given key, set an item's data in cache

    @action
    setData = (args: Args, data: Data): void => {
        const key = argsToKey(args);
        this.log(`${this.name}: receiving data for ${key}:`, data);

        const item = this._getOrCreate(key);
        item.loading = false;
        item.hasData = true;
        item.hasError = false;
        item.error = undefined;
        item.data = data;
        item.time = new Date(Date.now());
    };

    // setData() action
    //
    // for a given key, set an item's data in cache

    @action
    setError = (args: Args, error: Err): void => {
        const key = argsToKey(args);
        this.log(`${this.name}: receiving error for ${key}:`, error);

        const item = this._getOrCreate(key);
        item.loading = false;
        item.hasError = true;
        item.error = error;
        item.time = new Date(Date.now());
    };

    // remove() action
    //
    // for a given key, remove the cached item

    @action
    remove = (args: Args): void => {
        const key = argsToKey(args);
        this.cache.delete(key);
    };

    // useGet()
    //
    // react hook to get data
    // because React doesn't like side effects during a render
    // call it every render because this'll be deduped upstream anyway

    useGet = (args: Args, options?: GetOptions): StoreItem<Data,Err>|undefined => {
        useEffect(() => void this.get(args, options));
        return this.read(args);
    };
}
