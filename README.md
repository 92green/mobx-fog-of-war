# mobx-fog-of-war ☁️ ⚔️ 🤯

![aoe](https://user-images.githubusercontent.com/345320/91411571-ddf2da80-e88b-11ea-8de7-c0f3462991f4.gif)

A simple, lazy front-end request coordinator and cache for [React](https://reactjs.org/) and [mobx](https://mobx.js.org/). Load your data by simply trying to view it, and build up a picture of your server's data over time.

- Efficient UI updates with [mobx](https://mobx.js.org/) observables.
- Connects to [rxjs](https://rxjs-dev.firebaseapp.com/) easily for fancy request behaviour.
- No data pre-processing, normalisation or schemas.
- Control your cache directly.

You're not required to think about "requesting" data in advance. Just try to access it using `store.get()` or the `store.useGet()` React hook, and if the corresponding data in your cache is missing or stale it'll prompt your request function to go and load the data. This makes it easy to do your data joins on the front-end, right in your components, keeping your data-joining-logic as minimal as possible.

If your _server_ is performing data joins (as many graphql APIs tend to do) then `mobx-fog-of-war` may not be right for you. In this case check out [enty](https://github.com/92green/enty) for normalised state management.

Install with `npm install react mobx mobx-react mobx-fog-of-war`

- 100% [typescript typed](https://www.typescriptlang.org/)
- 100% tested with [jest](https://jestjs.io/), [rx marble tests](https://rxjs-dev.firebaseapp.com/guide/testing/internal-marble-tests) and [enzyme](https://github.com/enzymejs/enzyme)
- Efficient bundling with [rollup](https://rollupjs.org/guide/en/)
- Project setup by [tsdx](https://tsdx.io/)
- Demo site powered by [nextjs](https://nextjs.org/)
- Monorepo managed with [lerna](https://github.com/lerna/lerna)

```js
import {Store, asyncRequest} from 'mobx-fog-of-war';

// getUser = async (id: UserArgs): Promise<User> => ...
// getPet = async (id: PetArgs): Promise<Pet> => ...

const userStore = new Store<string,User,Error>({
    name: 'User Store',
    maxAge: 10000,
    request: asyncRequest(getUser)
});

const petStore = new Store<string,Pet,Error>({
    name: 'Pet Store',
    maxAge: 10000,
    request: asyncRequest(getPet)
});

const [StoreProvider, useStore] = provideStores({userStore, petStore});

// ...

import React from 'react';
import {observer} from 'mobx-react';
import 'mobx-react/batchingForReactDom';

const Main = (props) => {
    return <StoreProvider>
        <UserView userId={props.userId} />
    </StoreProvider>;
};

const Loader = (props) => {
    let {storeItem, children} = props;
    if(!storeItem) return null;
    if(storeItem.loading) return <div>Loading</div>;
    if(storeItem.hasError) return <div>Error: {storeItem.error.message}</div>;
    if(!storeItem.hasData) return <div>Not found</div>;
    return children();
};

const UserView = observer(props => {
    const {userStore} = useStore();
    const userFromStore = userStore.useGet(props.userId);
    const user = userFromStore.data;

    return <Loader storeItem={userFromStore}>
        {() => <div>
            Name: {user.name}
            Pets: {user.petIds.map(petId => <PetView key={petId} petId={petId} />)}
        </div>}
    </Loader>;
});

const PetView = observer(props => {
    const {petStore} = useStore();
    const petFromStore = userStore.useGet(props.petId);
    const pet = petFromStore.data;

    return <Loader storeItem={petFromStore}>
        {() => <div>
            Pet name: {pet.name}
        </div>}
    </Loader>;
});
```
