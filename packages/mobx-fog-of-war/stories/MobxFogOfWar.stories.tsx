import React from 'react';

import {Store, asyncRequest, provideStores} from '../src/index';

interface User {
    id: string;
    name: string;
    petIds: string[];
}

interface Pet {
    id: string;
    name: string;
}

const getUser = async (id: string): Promise<User> => {
    console.log('id', id);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const users = {
        a: {
            id: 'a',
            name: 'Angus',
            petIds: ['m','n']
        },
        b: {
            id: 'b',
            name: 'Bob',
            petIds: ['o']
        },
        c: {
            id: 'c',
            name: 'Clampy',
            petIds: ['p']
        }
    };
    if(id === 'x') {
        throw new Error('Oh dear');
    }
    return users[id];
};

const getPet = async (id: string): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const users = {
        a: {
            id: 'm',
            name: 'Mousey'
        },
        b: {
            id: 'n',
            name: 'Newty'
        },
        c: {
            id: 'o',
            name: 'Octoboy'
        },
        y: {
            id: 'p',
            name: 'Peepy'
        }
    };
    return users[id];
};

const userStore = new Store<string,User,Error>({
    name: 'User Store',
    staleTime: 10, // seconds
    request: asyncRequest(getUser)
});

const petStore = new Store<string,Pet,Error>({
    name: 'Pet Store',
    staleTime: 10, // seconds
    request: asyncRequest(getPet)
});

const [StoreProvider, useStore] = provideStores({userStore, petStore});

// ...

import type {StoreItem} from '../src/index';
import {observer} from 'mobx-react';

interface ExampleProps {
    userId: string;
}

export const Example = (props: ExampleProps): React.ReactElement => {
    return <StoreProvider>
        <UserView userId="a" />
    </StoreProvider>;
};

interface LoaderProps<Data,Err> {
    storeItem: StoreItem<Data,Err>;
    children: React.ReactNode;
}

const Loader = observer((props: LoaderProps<unknown,Error>): React.ReactElement => {
    const {storeItem, children} = props;
    if(!storeItem) return null;
    if(storeItem.loading) return <div>Loading</div>;
    if(storeItem.hasError && storeItem.error) return <div>Error: {storeItem.error.message}</div>;
    if(storeItem.hasData && !storeItem.data) return <div>Not found</div>;
    return children();
});

const UserView = observer(props => {
    const {userStore} = useStore();
    const userFromStore = userStore.useGet(props.userId);
    // console.log('userFromStore', userFromStore && userFromStore.loading);
    const user = userFromStore?.data;

    return <Loader storeItem={userFromStore}>
        {() => <div>
            Name: {user.name}
            Pets: {user.petIds.map(petId => <PetView key={petId} petId={petId} />)}
        </div>}
    </Loader>;
});

const PetView = observer(props => {
    const {petStore} = useStore();
    const petFromStore = petStore.useGet(props.petId);
    const pet = petFromStore?.data;

    return <Loader storeItem={petFromStore}>
        {() => <div>
            Pet name: {pet.name}
        </div>}
    </Loader>;
});

export default {
    title: 'Example 1'
};
