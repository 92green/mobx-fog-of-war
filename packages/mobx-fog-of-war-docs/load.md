---
id: load
title: The Load component
---

The in-built `<Load />` component is a general purpose React component to control rendering based off the state of StoreItems. It can understand the loading state multiple store items at once, and can also be easily customised to respond to different combinations of loading states.

```jsx
import {Load} from 'mobx-fog-of-war';

// customise for your app

// props.errors is an array of store items that have errors
const LoaderError = (props) => <div>Error: {props.errors[0].message}</div>

export const Loader = (props) => <Load
    loading={<span>Loading</span>}
    errorComponent={LoaderError}
    {...props}
/>;

// usage
const UserView = observer(props => {
    const userFromStore = userStore.useGet(props.userId);
    const petFromStore = petStore.useGet(props.petId);

    return <Loader storeItems={[userFromStore, petFromStore]}>
        {(user, pet) => <div>User's name: {user.name}, Pet's name: {pet.name}</div>}
    </Loader>;
});
```

### Load Props

```jsx
type Props = {
    storeItems: StoreItem[];
    children: (data1: D, data2: D...) => React.ReactElement|null;
    priorities?: string;
    loading?: React.ReactElement|null;
    loadingComponent?: React.ComponentType<{storeItems: StoreItem[]>;
    error?: React.ReactElement|null;
    errorComponent?: React.ComponentType<{storeItems: StoreItem[], errors: E[]}>;
};
```

#### storeItems

An array of one or more StoreItems.

#### children

A function that will be called to render children conditionally depending on the state of the StoreItem's and the priorities. It is passed the `.data` of each StoreItem in the `storeItems` array as arguments.

#### priorities

The `priorities` prop is a small code (a string) that describes which state the `<Load />` component should display. It can only contain the uppercase or lowercase characters "l", "e", "d" and "f", which correspond to types of checks against the state of the StoreItems. These are tested one by one from left to right.

For example, `priorities="leD"` tells `<Load />` to do the following:

1. render the loading state if anything is loading
2. else, render the error state if anything has errored
3. else, render children if *all* `storeItems` have data
4. else, render nothing.



- `"l"` - if any `storeItems` are loading, this will show the `loading` component or element, or render nothing if `loading` or `loadingComponent` is not provided.
- `"e"` - if any `storeItems` have an error, this will show the `error` component or element, or render nothing if `error` or `errorComponent` is not provided.
- `"d"` - if any `storeItems` have data, this will render the Load component's children.
- `"L"` - works like `"l"`, except the test only passes when *all* `storeItems` are loading.
- `"E"` - works like `"e"`, except the test only passes when *all* `storeItems` have an error.
- `"D"` - works like `"d"`, except the test only passes when *all* `storeItems` have data.

If no checks pass, normally nothing is rendered. However if `"f"` is added to the end of the priorities string then the `<Load />` component's children will be rendered.

Additionally there is the ability to have ternary logic, such as `e?le:Dl`. This example can be understood as *"If there is an error, use `le` as the priorities string. If not, use `Dl` as the priorities string"*.

The default is `e?le:Dl`, which does the following:

- If any `storeItems` have an error
  1. render the loading state if anything is loading 
  2. else, render the error state
- If no `storeItems` have an error
  1. render children if *all* `storeItems` have data
  2. else, render the loading state if anything is loading
  3. else, render nothing.

#### loading and loadingComponent

Optional. Provide either a React element to `loading`, or a React component to `loadingComponent` to tell `<Load />` what to render when the store items are loading.

The `loadingComponent` component is passed `storeItems` as a prop.

#### error and errorComponent

Optional. Provide either a React element to `error`, or a React component to `errorComponent` to tell `<Load />` what to render when the store items are in an error state.

The `errorComponent` component is passed `storeItems` as a prop, and an array of errors as an `errors` prop.
