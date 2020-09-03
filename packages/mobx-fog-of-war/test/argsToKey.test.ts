import {argsToKey} from '../src/index';

describe('argsToKey', () => {
    it('should produce different outputs for different params', () => {
        expect(argsToKey({a:1,b:2})).toEqual(argsToKey({a:1,b:2}));
        expect(argsToKey({a:1,b:2})).not.toEqual(argsToKey({a:1,b:3}));
        expect(argsToKey({a:1,b:2})).not.toEqual(argsToKey({a:1,b:"2"}));
    });

    it('should treat objects with different orders as the same', () => {
        expect(argsToKey({a:1,b:2,c:3})).toEqual(argsToKey({c:3,b:2,a:1}));
    });

    it('should process deeply', () => {
        expect(argsToKey({bb: true, aa: {a:1,b:2,c:3}})).toEqual(argsToKey({aa: {c:3,b:2,a:1}, bb: true}));
    });

    it('should treat missing keys, keys with null values and keys with undefined values as equivalent', () => {
        expect(argsToKey({a:null,b:1})).toEqual(argsToKey({b:1}));
        expect(argsToKey({a:undefined,b:1})).toEqual(argsToKey({b:1}));
    });

    it('should produce empty string for undefined', () => {
        expect(argsToKey(undefined)).toBe('');
    });
});
