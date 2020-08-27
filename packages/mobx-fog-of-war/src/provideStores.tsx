import React from 'react';

export const provideStores = <S,>(stores: S): [React.FunctionComponent<unknown>, () => S] => {

    const StoreContext = React.createContext<S|undefined>(undefined);

    const StoreProvider = (props: unknown) => <StoreContext.Provider value={stores} {...props} />;

    const useStore = (): S => {
        const storesFromContext: S|undefined = React.useContext(StoreContext);
        if(!storesFromContext) {
            throw new Error('No StoreProvider provided');
        }
        return storesFromContext;
    };

    return [StoreProvider, useStore];
};
