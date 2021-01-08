import {renderHook} from '@testing-library/react-hooks';
import {useEffectVariadic} from '../src/index';

describe('useEffectVariadic', () => {
    it('should fire when deps change', () => {

        const create = jest.fn();
        const destroy = jest.fn();

        const {rerender} = renderHook<{deps: unknown[]},void>(
            ({deps}) => {
                useEffectVariadic(() => {
                    create(deps);
                    return () => destroy(deps);
                }, deps);
            },
            {
                initialProps: {
                    deps: []
                }
            }
        );

        expect(create).toHaveBeenCalledTimes(1);
        expect(destroy).toHaveBeenCalledTimes(0);

        rerender({deps: []});

        expect(create).toHaveBeenCalledTimes(1);
        expect(destroy).toHaveBeenCalledTimes(0);

        rerender({deps: ['foo']});

        expect(create).toHaveBeenCalledTimes(2);
        expect(destroy).toHaveBeenCalledTimes(1);

        rerender({deps: ['foo']});

        expect(create).toHaveBeenCalledTimes(2);
        expect(destroy).toHaveBeenCalledTimes(1);

        rerender({deps: ['foo','bar']});

        expect(create).toHaveBeenCalledTimes(3);
        expect(destroy).toHaveBeenCalledTimes(2);

        rerender({deps: ['ffoo','bar']});

        expect(create).toHaveBeenCalledTimes(4);
        expect(destroy).toHaveBeenCalledTimes(3);

        rerender({deps: ['ffoo','bar']});

        expect(create).toHaveBeenCalledTimes(4);
        expect(destroy).toHaveBeenCalledTimes(3);

        const arr: number[] = [];

        rerender({deps: arr});

        expect(create).toHaveBeenCalledTimes(5);
        expect(destroy).toHaveBeenCalledTimes(4);

        rerender({deps: arr});

        expect(create).toHaveBeenCalledTimes(5);
        expect(destroy).toHaveBeenCalledTimes(4);
    });
});


