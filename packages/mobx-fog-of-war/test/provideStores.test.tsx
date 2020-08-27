
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
});
