import {useEffect, useRef} from 'react';

const equal = (a: unknown[], b: unknown[]): boolean => {
    if(a === b) return true;
    if(a.length !== b.length) return false;
    return a.every((e,i) => Object.is(e,b[i]));
};

export const useEffectVariadic = (create: () => (() => void)|void, deps: unknown[]): void => {
    const prevDeps = useRef<unknown[]>([]);
    const count = useRef<number>(0);

    if(!equal(prevDeps.current, deps)) count.current++;
    prevDeps.current = deps;

    useEffect(create, [count.current]);
};
