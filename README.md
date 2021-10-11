# mobx-fog-of-war ☁️ ⚔️ 🤯

[![npm](https://img.shields.io/npm/v/mobx-fog-of-war.svg)](https://www.npmjs.com/package/mobx-fog-of-war) ![Master build](https://github.com/92green/mobx-fog-of-war/workflows/CI/badge.svg?branch=master) ![Coverage 100%](https://img.shields.io/badge/coverage-100%25-green) ![Size: <2.5KB](https://img.shields.io/badge/Size-<3KB-blue) ![Maturity: Early Days](https://img.shields.io/badge/Maturity-Early%20days-yellow) ![Coolness Moderate](https://img.shields.io/badge/Coolness-Moderate-blue) 

![aoe](https://user-images.githubusercontent.com/345320/91411571-ddf2da80-e88b-11ea-8de7-c0f3462991f4.gif)


A simple, lazy front-end request coordinator and cache for [React](https://reactjs.org/) and [mobx](https://mobx.js.org/). Load your data by simply trying to view it, and build up a picture of your server's data over time.

### [Look here for documentation and examples](https://92green.github.io/mobx-fog-of-war/)

You're not required to think about "requesting" data in advance. Just try to access it using [store.get()](store.md#storeget) or the [store.useGet()](store.md#storeuseget) React hook, and if the corresponding data in your cache is missing or stale it'll prompt your request function to go and load the data. This makes it easy to do your data joins on the front-end, right in your components, keeping your data-joining-logic as minimal as possible.

- Efficient UI updates with [mobx](https://mobx.js.org/) observables.
- Connects to [rxjs](https://rxjs-dev.firebaseapp.com/) easily for buffering and batching requests.
- Control your cache directly.
- No normalisation or schemas.

When used with buffering and batching, it could be thought of as **"[dataloader](https://github.com/graphql/dataloader) but for React"**.

If your _server_ is performing data joins (as many graphql APIs tend to do) then `mobx-fog-of-war` may not be right for you. In this case check out [enty](https://github.com/92green/enty) for normalised state management.


## Installation

```bash
yarn add react mobx mobx-react mobx-fog-of-war
// or
npm install --save react mobx mobx-react mobx-fog-of-war
```


## Nice things

- Small bundle: `Store` + `asyncRequest` < 2.1KB gzipped, entire library < 3KB gzipped
- 100% [typescript typed](https://www.typescriptlang.org/)
- 100% tested with [jest](https://jestjs.io/), [rx marble tests](https://rxjs-dev.firebaseapp.com/guide/testing/internal-marble-tests) and [enzyme](https://github.com/enzymejs/enzyme)
- Efficient bundling with [rollup](https://rollupjs.org/guide/en/)
- Project setup by [tsdx](https://tsdx.io/)
- Demo site powered by [nextjs](https://nextjs.org/)
- Monorepo managed with [lerna](https://github.com/lerna/lerna)

## Example with React

### 1. Set up your application's stores

```typescript
// requesters

const getUser = async (id: UserArgs): Promise<User> => {
    const response = await fetch(`http://example.com/user/${id}`)
    return new User(await response.json());
};

const getPet = async (id: PetArgs): Promise<Pet> => {
    const response = await fetch(`http://example.com/pet/${id}`)
    return new Pet(await response.json());
};

// stores

import {Store, asyncRequest} from 'mobx-fog-of-war';

const userStore = new Store<string,User,Error>({
    name: 'User Store',
    staleTime: 60, // after 60 seconds, the item is eligible to be requested again
    request: asyncRequest(getUser)
});

const petStore = new Store<string,Pet,Error>({
    name: 'Pet Store',
    staleTime: 60,
    request: asyncRequest(getPet)
});
```

### 2. Components can request data

```jsx
import {observer} from 'mobx-react';

// render a user, it'll go get the required data

const UserView = observer(props => {
    const userFromStore = userStore.useGet(props.userId);

    return <Loader storeItem={userFromStore}>
        {user => <div>
            Name: {user.name}
            Pets: {user.petIds.map(petId => <PetView key={petId} petId={petId} />)}
        </div>}
    </Loader>;
});

// render some pets, they'll go get the required data

const PetView = observer(props => {
    const petFromStore = petStore.useGet(props.petId);

    return <Loader storeItem={petFromStore}>
        {pet => <div>
            Pet name: {pet.name}
        </div>}
    </Loader>;
});

// handle request state as you like
// for example, a component using render props
// or use the in-built <Load> component

const Loader = observer(props => {
    let {storeItem, children} = props;
    if(storeItem.loading) return <div>Loading</div>;
    if(storeItem.hasError) return <div>Error: {storeItem.error.message}</div>;
    if(!storeItem.hasData) return null;
    return children(storeItem.data);
});
```

## Development

This library is written and maintained by [Damien Clarke](https://damienclarke.me/), with feedback from others at [92green](https://github.com/92green). It was built to meet the data-requesting and caching needs of products at [Blueflag](https://blueflag.com.au/).
All online library discussion happens over on [Github](https://github.com/92green/mobx-fog-of-war).

I hope this library helps solve some data requesting problems for you. 🎉
