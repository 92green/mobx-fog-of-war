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

        const result = sortByArgsArray<number,string,string,Item>(
            [1,2,3,4],
            items,
            (item: Item) => item.id,
            (item: Item) => item.name,
            args => `${args} not found`
        );

        expect(result).toEqual([
            {args: 1, data: 'one'},
            {args: 2, data: 'two'},
            {args: 3, data: 'three'},
            {args: 4, error: '4 not found'}
        ]);

    });
});
