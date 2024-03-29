import {StoreItem, createStoreItemPromise, createStoreItemAwait, createStoreItemTuple} from './Store';
import type {StoreItemGetPromise, StoreItemGetAwait, StoreItemGetTuple} from './Store';
import {computed} from 'mobx';

const priorityPropMap = {
    l: 'loading',
    d: 'hasData',
    e: 'hasError'
};

type Priority = 'l'|'d'|'e'|'n';

const checkPriority = (storeItems: StoreItem<unknown,unknown>[], type: string): boolean => {
    const typeLower = type.toLowerCase();
    if('ldef'.indexOf(typeLower) === -1) {
        throw new Error(`Invalid priority`);
    }
    const prop = priorityPropMap[typeLower as 'l'|'d'|'e'] as 'loading'|'hasData'|'hasError';
    if(type === typeLower) {
        return storeItems.some(dep => dep && dep[prop]);
    }
    return storeItems.every(dep => dep && dep[prop]);
};

export const getPriority = (storeItems: StoreItem<unknown,unknown>[], priorities: string): Priority => {

    priorities = priorities.replace(/\s/g, '');

    const ternary = priorities.match(/(.+?)\?(.+?):(.+)/);
    if(ternary) {
        const [, condition, ifTrue, ifFalse] = ternary;
        const isTrue = checkPriority(storeItems, condition);
        return getPriority(storeItems, isTrue ? ifTrue : ifFalse);
    }

    const state = priorities.split('').find(type => checkPriority(storeItems, type))
        || (/f$/.test(priorities) ? 'd' : 'n');

    return state.toLowerCase() as Priority;
};

type MergedStoreItemConfig<DM,EM,D,E> = {
    storeItems: StoreItem<D,E>[];
    mergeData: (storeItems: StoreItem<D,E>[]) => DM;
    mergeError: (storeItems: StoreItem<D,E>[]) => EM;
    priorities?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class MergedStoreItem<DM,EM,D=any,E=any> {
    storeItems: StoreItem<D,E>[]
    mergeData: (storeItems: StoreItem<D,E>[]) => DM;
    mergeError: (storeItems: StoreItem<D,E>[]) => EM;
    priorities: string;

    constructor(config: MergedStoreItemConfig<DM,EM,D,E>) {
        const {
            storeItems,
            mergeData,
            mergeError,
            priorities = 'e?le:Dl'
        } = config;

        this.storeItems = storeItems;
        this.mergeData = mergeData;
        this.mergeError = mergeError;
        this.priorities = priorities;
    }

    @computed get _priority(): Priority {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const typedStoreItems = this.storeItems as StoreItem<any,any>[];
        return getPriority(typedStoreItems, this.priorities);
    }

    @computed get loading(): boolean {
        return this._priority === 'l';
    }
    @computed get hasData(): boolean {
        return this._priority === 'd';
    }
    @computed get hasError(): boolean {
        return this._priority === 'e';
    }
    @computed get data(): DM {
        return this.mergeData(this.storeItems);
    }
    @computed get error(): EM {
        return this.mergeError(this.storeItems);
    }
    get time(): Date {
        const times = this.storeItems.map(item => item.time);
        return times.length > 0
            ? times.reduce((a, b) => a > b ? a : b)
            : new Date();
    }

    promise: StoreItemGetPromise<DM,EM> = createStoreItemPromise<DM,EM>(this);
    await: StoreItemGetAwait<DM> = createStoreItemAwait<DM,EM>(this);
    tuple: StoreItemGetTuple<DM,EM> = createStoreItemTuple<DM,EM>(this); // deprecated
}

export function mergeStoreItems<D,E>(storeItems?: StoreItem<D,E>[], priorities?: string): StoreItem<D[],E[]>;
export function mergeStoreItems<D1,E1,D2,E2,D3,E3,D4,E4,D5,E5>(storeItems: [StoreItem<D1,E1>,StoreItem<D2,E2>,StoreItem<D3,E3>,StoreItem<D4,E4>,StoreItem<D5,E5>], priorities?: string): StoreItem<[D1,D2,D3,D4,D5],[E1,E2,E3,E4,E5]>;
export function mergeStoreItems<D1,E1,D2,E2,D3,E3,D4,E4>(storeItems: [StoreItem<D1,E1>,StoreItem<D2,E2>,StoreItem<D3,E3>,StoreItem<D4,E4>], priorities?: string): StoreItem<[D1,D2,D3,D4],[E1,E2,E3,E4]>;
export function mergeStoreItems<D1,E1,D2,E2,D3,E3>(storeItems: [StoreItem<D1,E1>,StoreItem<D2,E2>,StoreItem<D3,E3>], priorities?: string): StoreItem<[D1,D2,D3],[E1,E2,E3]>;
export function mergeStoreItems<D1,E1,D2,E2>(storeItems: [StoreItem<D1,E1>,StoreItem<D2,E2>], priorities?: string): StoreItem<[D1,D2],[E1,E2]>;
export function mergeStoreItems<D1,E1>(storeItems: [StoreItem<D1,E1>], priorities?: string): StoreItem<[D1],[E1]>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export function mergeStoreItems(storeItems: any, priorities = 'e?le:Dl'): StoreItem<any,any> {
    if(storeItems === undefined) {
        return new StoreItem();
    }
    const typedStoreItems = storeItems as StoreItem<unknown,unknown>[];
    const priority = getPriority(typedStoreItems, priorities);
    const merged = new StoreItem();
    merged.loading = priority === 'l';
    merged.hasData = priority === 'd';
    merged.hasError = priority === 'e';
    merged.data = typedStoreItems.map(s => s.data);
    merged.error = typedStoreItems.map(s => s.error);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return merged;
}
