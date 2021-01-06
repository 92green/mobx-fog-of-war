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

const checkPriority = (storeItems: StoreItem<unknown,unknown>[], type: string): boolean => {
    const typeLower = type.toLowerCase();
    if('ldef'.indexOf(typeLower) === -1) {
        throw new Error(`Invalid priority`);
    }
    const prop = priorityPropMap[typeLower as 'l'|'d'|'e'] as 'loading'|'hasData'|'hasError';
    const fn: 'some'|'every' = type === typeLower ? 'some' : 'every';
    return storeItems[fn](dep => dep && dep[prop]);
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

type ChildrenReturn = React.ReactElement|React.ReactElement[]|null;

type Rest = {[key: string]: unknown};

export type LoadPropsCommon = {
    priorities?: string;
    loading?: React.ReactElement|null;
    error?: React.ReactElement|null;
    [key: string]: unknown;
};

export type StoreItemsArray<D1,E1> = StoreItem<D1,E1>[];
export type StoreItems1<D1,E1> = [StoreItem<D1,E1>];
export type StoreItems2<D1,E1,D2,E2> = [StoreItem<D1,E1>,StoreItem<D2,E2>];
export type StoreItems3<D1,E1,D2,E2,D3,E3> = [StoreItem<D1,E1>,StoreItem<D2,E2>,StoreItem<D3,E3>];
export type StoreItems4<D1,E1,D2,E2,D3,E3,D4,E4> = [StoreItem<D1,E1>,StoreItem<D2,E2>,StoreItem<D3,E3>,StoreItem<D4,E4>];
export type StoreItems5<D1,E1,D2,E2,D3,E3,D4,E4,D5,E5> = [StoreItem<D1,E1>,StoreItem<D2,E2>,StoreItem<D3,E3>,StoreItem<D4,E4>,StoreItem<D5,E5>];

export type LoadPropsArray<D1,E1> = LoadPropsCommon & {
    storeItems: StoreItem<D1,E1>[],
    children: (data: Array<D1|undefined>, props: Rest) => ChildrenReturn;
    loadingComponent?: React.ComponentType<{storeItems: StoreItemsArray<D1,E1>[]}>;
    errorComponent?: React.ComponentType<{storeItems: StoreItemsArray<D1,E1>[], errors: Array<E1>}>;
};

export type LoadProps1<D1,E1> = LoadPropsCommon & {
    storeItems: StoreItems1<D1,E1>,
    children: (data: [D1|undefined], props: Rest) => ChildrenReturn;
    loadingComponent?: React.ComponentType<{storeItems: StoreItems1<D1,E1>}>;
    errorComponent?: React.ComponentType<{storeItems: StoreItems1<D1,E1>, errors: [E1?]}>;
};

export type LoadProps2<D1,E1,D2,E2> = LoadPropsCommon & {
    storeItems: StoreItems2<D1,E1,D2,E2>,
    children: (data: [D1|undefined,D2|undefined], props: Rest) => ChildrenReturn;
    loadingComponent?: React.ComponentType<{storeItems: StoreItems2<D1,E1,D2,E2>}>;
    errorComponent?: React.ComponentType<{storeItems: StoreItems2<D1,E1,D2,E2>, errors: [E1?,E2?]}>;
};

export type LoadProps3<D1,E1,D2,E2,D3,E3> = LoadPropsCommon & {
    storeItems: StoreItems3<D1,E1,D2,E2,D3,E3>,
    children: (data: [D1|undefined,D2|undefined,D3|undefined], props: Rest) => ChildrenReturn;
    loadingComponent?: React.ComponentType<{storeItems: StoreItems3<D1,E1,D2,E2,D3,E3>}>;
    errorComponent?: React.ComponentType<{storeItems: StoreItems3<D1,E1,D2,E2,D3,E3>, errors: [E1?,E2?,E3?]}>;
};

export type LoadProps4<D1,E1,D2,E2,D3,E3,D4,E4> = LoadPropsCommon & {
    storeItems: StoreItems4<D1,E1,D2,E2,D3,E3,D4,E4>,
    children: (data: [D1|undefined,D2|undefined,D3|undefined,D4|undefined], props: Rest) => ChildrenReturn;
    loadingComponent?: React.ComponentType<{storeItems: StoreItems4<D1,E1,D2,E2,D3,E3,D4,E4>}>;
    errorComponent?: React.ComponentType<{storeItems: StoreItems4<D1,E1,D2,E2,D3,E3,D4,E4>, errors: [E1?,E2?,E3?,E4?]}>;
};

export type LoadProps5<D1,E1,D2,E2,D3,E3,D4,E4,D5,E5> = LoadPropsCommon & {
    storeItems: StoreItems5<D1,E1,D2,E2,D3,E3,D4,E4,D5,E5>,
    children: (data: [D1|undefined,D2|undefined,D3|undefined,D4|undefined,D5|undefined], props: Rest) => ChildrenReturn;
    loadingComponent?: React.ComponentType<{storeItems: StoreItems5<D1,E1,D2,E2,D3,E3,D4,E4,D5,E5>}>;
    errorComponent?: React.ComponentType<{storeItems: StoreItems5<D1,E1,D2,E2,D3,E3,D4,E4,D5,E5>, errors: [E1?,E2?,E3?,E4?,E5?]}>;
};

export type LoadProps<D1,E1,D2,E2,D3,E3,D4,E4,D5,E5> = LoadProps5<D1,E1,D2,E2,D3,E3,D4,E4,D5,E5>
    |LoadProps4<D1,E1,D2,E2,D3,E3,D4,E4>
    |LoadProps3<D1,E1,D2,E2,D3,E3>
    |LoadProps2<D1,E1,D2,E2>
    |LoadProps1<D1,E1>
    |LoadPropsArray<D1,E1>;

type LoadComponentProps = {
    renderer: () => ChildrenReturn;
};

// render children into a component, so children rendered can use their own hooks and have their own lifecycles
function LoadComponent(props: LoadComponentProps): React.ReactElement {
    return <>{props.renderer()}</>;
}

function LoadInner<D1,E1,D2,E2,D3,E3,D4,E4,D5,E5>(props: LoadProps<D1,E1,D2,E2,D3,E3,D4,E4,D5,E5>): React.ReactElement|null {
    const {
        children,
        priorities = 'e?le:Dl',
        loading,
        loadingComponent: LoadingComponent,
        error,
        errorComponent: ErrorComponent,
        storeItems,
        ...rest
    } = props;

    const typedStoreItems = (storeItems as unknown) as StoreItem<unknown,unknown>[];

    const priority = getPriority(typedStoreItems, priorities);
    if(priority === 'n') {
        return null;
    }
    if(priority === 'l') {
        return LoadingComponent
            // just let LoadProps type enforce children() args, as it can have overloads
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            ? <LoadingComponent storeItems={typedStoreItems} {...rest} />
            : (loading || null);
    }
    if(priority === 'e') {
        const errors = typedStoreItems
            .map(dep => dep.error)
            .filter(error => error);

        return ErrorComponent
            // just let LoadProps type enforce children() args, as it can have overloads
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            ? <ErrorComponent storeItems={typedStoreItems} errors={errors} {...rest} />
            : (error || null);
    }

    // just let LoadProps type enforce children() args, as it can have overloads
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return <LoadComponent renderer={() => children(typedStoreItems.map(item => item.data), rest)} />;
}

export const Load = observer(LoadInner);
