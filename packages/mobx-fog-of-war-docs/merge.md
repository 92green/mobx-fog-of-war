---
id: merge
title: Merging StoreItems
---

The `MergedStoreItem` class allows you to merge together multiple StoreItems, which is useful for when you have multiple store items and need to reduce the loading states into a single loading state. The loading state of the produced StoreItem is derived from the loading states of each of the input StoreItems, and you can define how the variuous combinations of loading states are to be merged using `priorities`.

```jsx
import {MergedStoreItem} from 'mobx-fog-of-war';

const userFromStore = userStore.get(userId);
const petFromStore = petStore.get(petId);
const userAndPetFromStore = new MergedStoreItem({
    storeItems: [userFromStore, petFromStore],
    mergeData: storeItems => storeItems.map(item => item.data),
    mergeError: storeItems => storeItems.find(item => item.error)?.error
});

// userAndPetFromStore.loading === true if either userFromStore or petFromStore are loading
// userAndPetFromStore.hasData === true if both userFromStore or petFromStore have data
// userAndPetFromStore.hasError === true if either userFromStore or petFromStore have an error
// userAndPetFromStore.data is [userFromStore.data, petFromStore.data]
// userAndPetFromStore.error is an error or undefined
```

### MergedStoreItem

```jsx
MergedStoreItem({
    storeItems: StoreItem[],
    mergeData: (storeItems: StoreItem[]) => D,
    mergeError: (storeItems: StoreItem[]) => E,
    priorities = 'e?le:Dl'
)
```

#### storeItems

An array of one or more StoreItems.

### mergeData

A function that provides the `storeItems` and allows the data to be merged as desired. The output of this function will be accessible at `mergedStoreItem.data`.

### mergeError

A function that provides the `storeItems` and allows the data to be merged as desired. The output of this function will be accessible at `mergedStoreItem.error`.

#### priorities

The `priorities` parameter is a small code (a string) that describes which loading state the output StoreItem should have. It can only contain the uppercase or lowercase characters "l", "e", "d" and "f", which correspond to types of checks against the state of the StoreItems. These are tested one by one from left to right.

For example, `priorities="leD"` tells `mergeStoreItems` to do the following:

1. output `.loading = true` if anything is loading
2. else, output `.hasError = true` if anything has errored
3. else, output `.hasData = true` if *all* input `storeItems` have data
4. else, all `.loading = false`, `.hasError = false` and `.hasData = false`.



- `"l"` - if any `storeItems` are loading, this will output `.loading = true`.
- `"e"` - if any `storeItems` have an error, this will output `.hasError = true`
- `"d"` - if any `storeItems` have data, this will output `.hasData = true`
- `"L"` - works like `"l"`, except the test only passes when *all* `storeItems` are loading.
- `"E"` - works like `"e"`, except the test only passes when *all* `storeItems` have an error.
- `"D"` - works like `"d"`, except the test only passes when *all* `storeItems` have data.

If no checks pass, normally no loading statuses are set to `true`. However if `"f"` is added to the end of the priorities string then it will output `.hasData = true`.

If an empty array is passed to `mergeStoreItems`, this is treated as though requests were successful, which by default will return a StoreItem with `.hasData = true`.

If `undefined` is passed to `mergeStoreItems`, this is treated as though a request never took place, which by default will return a StoreItem with `.loading = false`, `.hasError = false` and `.hasData = false`.

Additionally there is the ability to have ternary logic, such as `e?le:Dl`. This example can be understood as *"If there is an error, use `le` as the priorities string. If not, use `Dl` as the priorities string"*.

The default is `e?le:Dl`, which does the following:

- If any `storeItems` have an error
  1. output `.loading = true` if anything is loading 
  2. else, output `.hasError = true`
- If no `storeItems` have an error
  1. output `.hasData = true` if *all* `storeItems` have data
  2. else, output `.loading = true` state if anything is loading
  3. else, output `.loading = false`, `.hasError = false` and `.hasData = false`.
