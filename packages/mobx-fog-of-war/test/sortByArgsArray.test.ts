import {sortByArgsArray} from '../src/index';

interface Item {
    id: number;
    name: string;
}

describe('sortbyArgsArray', () => {
    it('should sort items by args array', () => {

        const items: Item[] = [
            {id: 3, name: 'three'},
            {id: 2, name: 'two'},
            {id: 1, name: 'one'}
        ];

        const result = sortByArgsArray<number,Item,string>(
            [1,2,3,4],
            items,
            item => item.id,
            args => `${args} not found`
        );

        expect(result).toEqual([
            {args: 1, data: {id: 1, name: 'one'}},
            {args: 2, data: {id: 2, name: 'two'}},
            {args: 3, data: {id: 3, name: 'three'}},
            {args: 4, error: '4 not found'}
        ]);

    });
});
