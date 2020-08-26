//
// fake fetch functions
//

interface User {
    id: string;
    name: string;
}

type UserArgs = string;

const fakeGetUser = async (id: UserArgs): Promise<User,string> => {
// eslint-disable-next-line no-console
    console.log(`User Fetcher: fetching user:`, id);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const users = {
        a: {
            id: 'a',
            name: 'Angus'
        },
        b: {
            id: 'b',
            name: 'Bob'
        },
        c: {
            id: 'c',
            name: 'Clampy'
        },
        y: {
            id: 'y',
            name: 'Yump'
        }
    };
    if(id === 'x') {
        throw 'Oh dear';
    }
    return users[id];
};

interface Comment {
    targetId: string;
    verb: string;
}

interface CommentArgs {
    userId: string
}

const fakeGetComments = async (args: CommentArgs): Promise<Comment[],string> => {
    // eslint-disable-next-line no-console
    console.log(`Comments Fetcher: fetching comments`, args);
    await new Promise(resolve => setTimeout(resolve, 1400));

    const comments = {
        a: [
            {
                targetId: 'x',
                verb: 'Amazing'
            }
        ],
        b: [
            {
                targetId: 'y',
                verb: 'Amazing'
            },
            {
                targetId: 'y',
                verb: 'Cool'
            },
            {
                targetId: 'x',
                verb: 'Amazing'
            },
            {
                targetId: 'z',
                verb: 'Amazing'
            }
        ],
        c: [
            {
                targetId: 'z',
                verb: 'Amazing'
            },
            {
                targetId: 'z',
                verb: 'Not very good'
            },
            {
                targetId: 'w',
                verb: 'Amazing'
            },
            {
                targetId: 'w',
                verb: 'Not very good'
            }
        ],
        y: [
            {
                targetId: 'q',
                verb: 'It'
            },
            {
                targetId: 'q',
                verb: 'Was'
            },
            {
                targetId: 'q',
                verb: 'Demolished!'
            }
        ]
    };

    return comments[args.userId] || [];
};

// const fakeFlagComment = async (args) => {
// // eslint-disable-next-line no-console
//     console.log(`Comments Fetcher: flagging a comment`, args);
//     await new Promise(resolve => setTimeout(resolve, 1400));
//     return {
//         yeahCool: true
//     };
// };

interface Place {
    id: string;
    name: string;
}

type PlaceArgs = string;

const fakeBatchGetPlace = async (ids: PlaceArgs[]): Promise<Place[],string> => {
// eslint-disable-next-line no-console
    console.log(`Place Fetcher: fetching places`, ids);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const places = {
        x: {
            id: 'x',
            name: 'the Sea'
        },
        y: {
            id: 'y',
            name: 'the Museum'
        },
        z: {
            id: 'z',
            name: 'the Gardens'
        }
    };

    return ids
        .map(id => {
            if(id === 'q') {
                throw 'Place is demolished!';
            }
            return places[id];
        })
        .filter(Boolean)
        .slice()
        .reverse();
};

//
// mobx stores
//

import {autorun, toJS} from 'mobx';
import {Store, rxRequest, asyncRequest, sortByArgsArray} from 'mobx-fog-of-war';
import type {Receive, StoreItem} from 'mobx-fog-of-war';
import {from} from 'rxjs';

//
// store instances and rx stuff for clever requests
//

import {bufferCount} from 'rxjs/operators';
import {bufferTime} from 'rxjs/operators';
import {mergeMap} from 'rxjs/operators';
import {concatMap} from 'rxjs/operators';

// stores

const userStore = new Store<UserArgs,User,string>({
    name: 'User Store',
    maxAge: 10,
    request: asyncRequest(fakeGetUser)
});

// eslint-disable-next-line no-console
// userStore.log = console.log;

const commentListStore = new Store<CommentArgs,Comment[],string>({
    name: 'Comment list Store',
    request: asyncRequest(fakeGetComments)
});

// eslint-disable-next-line no-console
{/*commentListStore.log = console.log;*/}

const placeStore = new Store<PlaceArgs,Place,string>({
    name: 'Place Store!',
    request: rxRequest(
        // collect requests for 100ms at a time
        bufferTime(100),
        // split batches apart that have more than 2 items (for illustrative purposes)
        mergeMap((argsArray: PlaceArgs[]) => from(argsArray).pipe(
            bufferCount(2)
        )),
        // make requests
        concatMap(async (argsArray: PlaceArgs[]): Promise<Array<Receive<PlaceArgs,Place,string>>> => {
            try {
                const items = await fakeBatchGetPlace(argsArray);
                return sortByArgsArray(argsArray, items, item => item.id, () => 'not found');
            } catch(error) {
                return argsArray.map(args => ({args, error}));
            }
        }),
        mergeMap(items => from(items))
    )
});

interface MyStores {
    userStore: Store<UserArgs,User,string>;
    commentListStore: Store<CommentArgs,Comment[],string>;
    placeStore: Store<PlaceArgs,Place,string>;
}

const stores: MyStores = {
    userStore,
    commentListStore,
    placeStore
};

//
// some mobx observable fun
//
// values returned from stores are mobx observables
// so we can just watch them change!

autorun(() => {
// eslint-disable-next-line no-console
    console.log('Autorun example: User C changed:', toJS(userStore.read("c")));
});

//
// user interface
//

import React, {useEffect} from 'react';
import {useState} from 'react';

import {observer} from 'mobx-react';
import 'mobx-react/batchingForReactDom';

// style

import styled from 'styled-components';
import {space, color, layout, flexbox, position, border, compose, textStyle} from 'styled-system';

const styledProps = compose(
    border,
    color,
    flexbox,
    layout,
    position,
    space,
    textStyle
);

export const Span = styled.span({}, styledProps);

export const Box = styled.div({display: 'block'}, styledProps);

export const Flex = styled.div({display: 'flex'}, styledProps);

export const Fixed = styled.div({position: 'fixed'}, styledProps);

export const Absolute = styled.div({position: 'absolute'}, styledProps);




// put stores in react context

const StoreContext = React.createContext(undefined);
const StoreProvider = (props) => <StoreContext.Provider value={stores} {...props} />;
const useStore = (): MyStores => {
    const stores: MyStores = React.useContext(StoreContext);
    if(!stores) {
        throw new Error('No store provider provided');
    }
    return stores;
};

// exciting top component with store provider

export default function Main(): React.ReactElement {

    const [userId, setUserId] = useState('');

    return <StoreProvider>
        <Layout>
            <SearchForm setUserId={setUserId} />
            <Box mb={3}>
                User ID to show: {`"${userId}"`}
                <br />
                {`Try searching for "a", "b", "c", "x" (for an error) or "y" (for an error in a subsequent request)`}
            </Box>
            {userId && <UserView userId={userId} />}
        </Layout>
    </StoreProvider>;
}

// boring layout, skip this one

interface LayoutProps {
    children: React.ReactElement[]
}

const Layout = (props: LayoutProps): React.ReactElement => {
    return <Box p={3}>
        <h1>mobx-fog-of-war demo</h1>
        <Box mt={3}>
            {props.children}
        </Box>
    </Box>;
};

// boring form, skip this one

interface SearchFormProps {
    setUserId: (userId: string) => void;
}

const SearchForm = (props: SearchFormProps): React.ReactElement => {
    const {setUserId} = props;

    const [input, setInput] = useState('');

    const handleSubmit = e => {
        e.preventDefault();
        setUserId(input);
    };

    const handleInputChange = e => setInput(e.currentTarget.value);

    return <form onSubmit={handleSubmit}>
        <Flex mb={3}>
            <Box mr={3}>
                <input value={input} onChange={handleInputChange} />
            </Box>
            <Box>
                <button type="submit" onClick={handleSubmit}>Load user</button>
            </Box>
        </Flex>
    </form>;
};

// exciting observer component that tries to load users and other data

const UserView = observer(props => {
    const {userId} = props;

    const {userStore, commentListStore} = useStore();
    const userFromStore = userStore.useGet(userId);
    const commentFromStore = commentListStore.useGet({userId});

    // if(!userFromStore) return null;
    // if(userFromStore.loading) return <Box>Loading</Box>;
    // if(userFromStore.error) return <Box>Error: {userFromStore.error}</Box>;
    // if(!userFromStore.data) return <Box>User not found</Box>;

    const retry = () => userStore.get(userId, {maxAge: 0});

    return <LoadingBoundary dependencies={[userFromStore]} retry={retry}>
        {() => {
            if(!userFromStore.data) return <Box>User not found</Box>;

            return <Box p={3}>
                <Box mb={3}>
                    Name: {userFromStore.data.name}
                </Box>
                {commentFromStore && commentFromStore.data && <>
                    <Box mb={3}>
                        Comments ({commentFromStore.data.length}):
                    </Box>
                    <Box>
                        {commentFromStore.data.map((comment, index) => {
                            return <Comment comment={comment} key={index} />;
                        })}
                    </Box>
                </>}
            </Box>;
        }}
    </LoadingBoundary>;
});

// exciting comment component that tries to load more details

const Comment = observer((props) => {
    const {comment} = props;

    const {placeStore} = useStore();
    const placeFromStore = placeStore.useGet(comment.targetId);

    return <Box mb={2}>
        {`"${comment.verb}"`}
        <span> ~ </span>
        <LoadingBoundary dependencies={[placeFromStore]}>
            {() => <span>at {placeFromStore.data ? placeFromStore.data.name : 'unknown place'}</span>}
        </LoadingBoundary>
    </Box>;
});

// loading boundary

type StateMapFn = (deps: Array<StoreItem<unknown,unknown>>) => boolean;

const stateMap: {[key: string]: StateMapFn} = {
    l: deps => deps.some(dep => dep && dep.loading),
    L: deps => deps.every(dep => dep && dep.loading),
    d: deps => deps.some(dep => dep && dep.hasData),
    D: deps => deps.every(dep => dep && dep.hasData),
    e: deps => deps.some(dep => dep && dep.error),
    E: deps => deps.every(dep => dep && dep.error),
    n: () => true,
    N: () => true
};

const checkState = (dependencies: Array<StoreItem<unknown,unknown>>, type: string): boolean => {
    const fn = stateMap[type];
    if(!fn) {
        throw new Error(`LoadingBoundary priority must be one of these characters ${Object.keys(stateMap).join('')}`);
    }
    return fn(dependencies);
};

const getState = (dependencies: Array<StoreItem<unknown,unknown>>, priorities): string => {

    priorities = priorities.replace(/\s/g, '');

    const ternary = priorities.match(/(.+?)\?(.+?):(.+)/);
    if(ternary) {
        const [, condition, ifTrue, ifFalse] = ternary;
        const isTrue = checkState(dependencies, condition);
        return getState(dependencies, isTrue ? ifTrue : ifFalse);
    }

    const state = priorities.split('').find(type => checkState(dependencies, type));
    return state.toLowerCase() || 'd';
};

interface ErrorProps {
    dependencies: Array<StoreItem<unknown,unknown>>;
    errors: unknown[];
}

interface LoadingBoundaryProps {
    children: () => React.ReactElement;
    dependencies?: Array<StoreItem<unknown,unknown>>;
    priorities?: string;
    loading?: React.ReactElement;
    error?: (props: ErrorProps) => React.ReactElement;
    none?: React.ReactElement;
    [propName: string]: unknown;
}


const LoadingBoundary = observer((props: LoadingBoundaryProps): React.ReactElement => {
    const {
        children,
        dependencies = [],
        priorities = 'e?le:Dln', // leDn
        loading = DefaultLoading,
        error: Err = DefaultError,
        none = null
    } = props;

    const renderables: {[key: string]: () => React.ReactElement} = {
        l: () => loading,
        d: children,
        // eslint-disable-next-line react/display-name
        e: () => <Err
            {...props}
            errors={dependencies.map(dep => dep.error).filter(Boolean)}
            dependencies={dependencies}
        />,
        n: () => none
    };

    const state = getState(dependencies, priorities);
    return renderables[state]();
});

const DefaultLoading = <span>Loading...</span>;

interface DefaultErrorProps {
    dependencies: Array<StoreItem<unknown,unknown>>;
    errors: unknown[];
    retry?: () => void;
}

const DefaultError = (props: DefaultErrorProps): React.ReactElement => {
    const {errors, retry} = props;
    return <span>
        Error: {errors[0]}
        {retry && <a onClick={retry}>, click here to try again</a>}
    </span>;
};
