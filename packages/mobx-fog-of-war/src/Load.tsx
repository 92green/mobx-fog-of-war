import React from 'react';
import {observer} from 'mobx-react';
import type {StoreItem} from './Store';

/*
how priorities work:

D = data, E = error, L = loading, F = fallback … Uppercase = all, Lowercase = one or more
It tries each going left to right to find a condition that satisfies, and shows the corresponding state

e.g. "leD" means "if any are loading, show loader. Else, if any are errored, show error. Else, if ALL have data, show data (the function passed as React children).
e.g. "ef" means "if any are errored, show error. Else, fallback and render the function passed as React children"
*/

const priorityPropMap = {
    l: 'loading',
    d: 'hasData',
    e: 'hasError'
};

type Priority = 'l'|'d'|'e'|'n';

type InnerStoreItems = [StoreItem<unknown,unknown>, ...StoreItem<unknown,unknown>[]];

const checkPriority = (storeItems: InnerStoreItems, type: string): boolean => {
    const typeLower = type.toLowerCase();
    if('ldef'.indexOf(typeLower) === -1) {
        throw new Error(`Invalid priority`);
    }
    const prop = priorityPropMap[typeLower as 'l'|'d'|'e'] as 'loading'|'hasData'|'hasError';
    const fn: 'some'|'every' = type === typeLower ? 'some' : 'every';
    return storeItems[fn](dep => dep && dep[prop]);
};

export const getPriority = (storeItems: InnerStoreItems, priorities: string): Priority => {

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

type StoreItems<D1,E1,D2,E2,D3,E3,D4,E4,D5,E5,D6,E6> = [
    StoreItem<D1,E1>,
    StoreItem<D2,E2>?,
    StoreItem<D3,E3>?,
    StoreItem<D4,E4>?,
    StoreItem<D5,E5>?,
    StoreItem<D6,E6>?
];

export type LoadProps<D1,E1,D2,E2,D3,E3,D4,E4,D5,E5,D6,E6> = {
    storeItems: StoreItems<D1,E1,D2,E2,D3,E3,D4,E4,D5,E5,D6,E6>,
    children: (data1?: D1, data2?: D2, data3?: D3, data4?: D4, data5?: D5, data6?: D6) => React.ReactElement|React.ReactElement[]|null;
    priorities?: string;
    loading?: React.ReactElement|null;
    loadingComponent?: React.ComponentType<{storeItems: StoreItems<D1,E1,D2,E2,D3,E3,D4,E4,D5,E5,D6,E6>}>;
    error?: React.ReactElement|null;
    errorComponent?: React.ComponentType<{storeItems: StoreItems<D1,E1,D2,E2,D3,E3,D4,E4,D5,E5,D6,E6>, errors: Array<E1|E2|E3|E4|E5|E6>}>;
};

function LoadInner<D1,E1,D2,E2,D3,E3,D4,E4,D5,E5,D6,E6>(props: LoadProps<D1,E1,D2,E2,D3,E3,D4,E4,D5,E5,D6,E6>): React.ReactElement|null {
    const {
        children,
        priorities = 'e?le:Dl',
        loading,
        loadingComponent: LoadingComponent,
        error,
        errorComponent: ErrorComponent
    } = props;

    const storeItems = (props.storeItems as unknown) as InnerStoreItems;

    const priority = getPriority(storeItems, priorities);
    if(priority === 'n') {
        return null;
    }
    if(priority === 'l') {
        return LoadingComponent
            // just let LoadProps type enforce children() args, as it can have overloads
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? <LoadingComponent storeItems={storeItems as any} />
            : (loading || null);
    }
    if(priority === 'e') {
        const errors = storeItems
            .map(dep => dep.error)
            .filter(error => error);

        return ErrorComponent
            // just let LoadProps type enforce children() args, as it can have overloads
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? <ErrorComponent storeItems={storeItems as any} errors={errors as any} />
            : (error || null);
    }

    // just let LoadProps type enforce children() args, as it can have overloads
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <>{children(...storeItems.map(item => item.data) as any)}</>;
}

export const Load = observer(LoadInner);
