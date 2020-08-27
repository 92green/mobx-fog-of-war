
import {provideStores} from '../src/index';
import React from 'react';
import Enzyme, {mount} from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({
    adapter: new Adapter()
});

describe('provideStores', () => {
    it('should return a provider and a hook', () => {
        const stores = 'STORES';
        const [StoreProvider, useStore] = provideStores(stores);

        const MyComponent = () => {
            const storesFromContext = useStore();
            return <h1>stores: {storesFromContext}</h1>;
        };

        const wrapper = mount(<StoreProvider>
            <MyComponent />
        </StoreProvider>);

        expect(wrapper.find('h1').text()).toBe('stores: STORES');
    });

    it('should throw error if useStore() is used but no store is provided', () => {
        const stores = 'STORES';
        const [,useStore] = provideStores(stores);

        const MyComponent = () => {
            try {
                const storesFromContext = useStore();
                return <h1>stores: {storesFromContext}</h1>;
            } catch(e) {
                return <h1>error: {e.message}</h1>;
            }
        };

        const wrapper = mount(<MyComponent />);

        expect(wrapper.find('h1').text()).toBe('error: No StoreProvider provided');
    });
});
