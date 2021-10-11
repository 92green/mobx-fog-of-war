module.exports = [
    {
        name: 'everything combined',
        path: "dist/mobx-fog-of-war.esm.js",
        limit: "3.0 KB",
        ignore: ['react','mobx','mobx-react']
    },
    {
        name: 'argsToKey',
        path: "dist/mobx-fog-of-war.esm.js",
        import: "{ argsToKey }",
        limit: "2.1 KB",
        ignore: ['react','mobx','mobx-react']
    },
    {
        name: 'asyncRequest',
        path: "dist/mobx-fog-of-war.esm.js",
        import: "{ asyncRequest }",
        limit: "2.2 KB",
        ignore: ['react','mobx','mobx-react']
    },
    {
        name: 'provideStores',
        path: "dist/mobx-fog-of-war.esm.js",
        import: "{ provideStores }",
        limit: "2.2 KB",
        ignore: ['react','mobx','mobx-react']
    },
    {
        name: 'rxBatch',
        path: "dist/mobx-fog-of-war.esm.js",
        import: "{ rxBatch }",
        limit: "2.4 KB",
        ignore: ['react','mobx','mobx-react']
    },
    {
        name: 'rxRequest',
        path: "dist/mobx-fog-of-war.esm.js",
        import: "{ rxRequest }",
        limit: "2.3 KB",
        ignore: ['react','mobx','mobx-react']
    },
    {
        name: 'sortByArgsArray',
        path: "dist/mobx-fog-of-war.esm.js",
        import: "{ sortByArgsArray }",
        limit: "2.2 KB",
        ignore: ['react','mobx','mobx-react']
    },
    {
        name: 'Store',
        path: "dist/mobx-fog-of-war.esm.js",
        import: "{ Store }",
        limit: "2.1 KB",
        ignore: ['react','mobx','mobx-react']
    },
    {
        name: 'mergeStoreItems',
        path: "dist/mobx-fog-of-war.esm.js",
        import: "{ Store }",
        limit: "2.1 KB",
        ignore: ['react','mobx','mobx-react']
    },
    {
        name: 'Load',
        path: "dist/mobx-fog-of-war.esm.js",
        import: "{ Load }",
        limit: "2.4 KB",
        ignore: ['react','mobx','mobx-react']
    }
];
