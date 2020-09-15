module.exports = [
    {
        name: 'everything combined',
        path: "dist/mobx-fog-of-war.esm.js",
        limit: "1.9 KB",
        ignore: ['react','mobx']
    },
    {
        name: 'argsToKey',
        path: "dist/mobx-fog-of-war.esm.js",
        import: "{ argsToKey }",
        limit: "1.3 KB",
        ignore: ['react','mobx']
    },
    {
        name: 'asyncRequest',
        path: "dist/mobx-fog-of-war.esm.js",
        import: "{ asyncRequest }",
        limit: "1.4 KB",
        ignore: ['react','mobx']
    },
    {
        name: 'provideStores',
        path: "dist/mobx-fog-of-war.esm.js",
        import: "{ provideStores }",
        limit: "1.4 KB",
        ignore: ['react','mobx']
    },
    {
        name: 'rxBatch',
        path: "dist/mobx-fog-of-war.esm.js",
        import: "{ rxBatch }",
        limit: "1.5 KB",
        ignore: ['react','mobx']
    },
    {
        name: 'rxRequest',
        path: "dist/mobx-fog-of-war.esm.js",
        import: "{ rxRequest }",
        limit: "1.4 KB",
        ignore: ['react','mobx']
    },
    {
        name: 'sortByArgsArray',
        path: "dist/mobx-fog-of-war.esm.js",
        import: "{ sortByArgsArray }",
        limit: "1.4 KB",
        ignore: ['react','mobx']
    },
    {
        name: 'Store',
        path: "dist/mobx-fog-of-war.esm.js",
        import: "{ Store }",
        limit: "1.3 KB",
        ignore: ['react','mobx']
    }
];
