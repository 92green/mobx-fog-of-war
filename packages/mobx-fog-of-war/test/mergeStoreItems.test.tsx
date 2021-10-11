import {mergeStoreItems, StoreItem, getPriority} from '../src/index';

const empty = new StoreItem<number,string>();

const loading = new StoreItem<number,string>();
loading.loading = true;

const error = new StoreItem<number,string>();
error.hasError = true;
error.error = 'error!';

const data = new StoreItem<number,string>();
data.hasData = true;
data.data = 123;

const dataString = new StoreItem<string,string>();
dataString.hasData = true;
dataString.data = "123";

describe('getPriority', () => {

    it('should return correct priorities', () => {
        expect(getPriority([loading, error, data, empty], 'led')).toBe('l');
        expect(getPriority([error, data, empty], 'led')).toBe('e');
        expect(getPriority([data, empty], 'led')).toBe('d');
        expect(getPriority([empty], 'led')).toBe('n');
        expect(getPriority([empty], 'ledf')).toBe('d');
    });

    it('should return correct priorities for everys', () => {
        expect(getPriority([loading, loading, loading], 'L')).toBe('l');
        expect(getPriority([loading, loading, loading, empty], 'L')).toBe('n');

        expect(getPriority([error, error, error], 'E')).toBe('e');
        expect(getPriority([error, error, error, empty], 'E')).toBe('n');

        expect(getPriority([data, data, data], 'D')).toBe('d');
        expect(getPriority([data, data, data, empty], 'D')).toBe('n');
    });

    it('should return correct priorities using ternaries', () => {
        expect(getPriority([loading, error], 'e?le:Dl')).toBe('l');
        expect(getPriority([error], 'e?le:Dl')).toBe('e');
        expect(getPriority([data], 'e?le:Dl')).toBe('d');
        expect(getPriority([data, loading], 'e?le:Dl')).toBe('l');
        expect(getPriority([loading], 'e?le:Dl')).toBe('l');
        expect(getPriority([empty], 'e?le:Dl')).toBe('n');
    });

    it('should error if given incorrect priority', () => {
        expect(() => getPriority([empty], 'ledQ')).toThrow('Invalid priority');
    });

    it('should return priority for empty array', () => {
        expect(getPriority([], 'led')).toBe('n');
        expect(getPriority([], 'e?le:Dl')).toBe('d');
    });

});

describe('mergeStoreItems', () => {

    describe('single items', () => {

        it('should pass through single items', () => {
            const emptyMerged = mergeStoreItems([empty]);
            const errorMerged = mergeStoreItems([error]);
            const dataMerged = mergeStoreItems([data]);
            const loadingMerged = mergeStoreItems([loading]);

            expect(emptyMerged.data).toEqual([empty.data]);
            expect(emptyMerged.error).toEqual([empty.error]);
            expect(errorMerged.data).toEqual([error.data]);
            expect(errorMerged.error).toEqual([error.error]);
            expect(dataMerged.data).toEqual([data.data]);
            expect(dataMerged.error).toEqual([data.error]);
            expect(loadingMerged.data).toEqual([loading.data]);
            expect(loadingMerged.error).toEqual([loading.error]);
        });

        it('should pass through multiple items', () => {
            const merged = mergeStoreItems([empty, error, data, dataString, loading]);

            expect(merged.data).toEqual([empty.data, error.data, data.data, dataString.data, loading.data]);
            expect(merged.error).toEqual([empty.error, error.error, data.error, dataString.error, loading.error]);
        });
    });

    describe('default priorities', () => {

        it('should preference loading when errored', () => {
            const merged = mergeStoreItems([error, loading, data, empty]);
            expect(merged.loading).toBe(true);
            expect(merged.hasData).toBe(false);
            expect(merged.hasError).toBe(false);
        });

        it('should preference errored when not loading', () => {
            const merged = mergeStoreItems([error, data, empty]);
            expect(merged.loading).toBe(false);
            expect(merged.hasData).toBe(false);
            expect(merged.hasError).toBe(true);
        });

        it('should preference data when not errored, only if all data exists', () => {
            const merged = mergeStoreItems([data, data]);
            expect(merged.loading).toBe(false);
            expect(merged.hasData).toBe(true);
            expect(merged.hasError).toBe(false);
        });

        it('should preference loading when not errored and incomplete data', () => {
            const merged = mergeStoreItems([data, data, loading]);
            expect(merged.loading).toBe(true);
            expect(merged.hasData).toBe(false);
            expect(merged.hasError).toBe(false);
        });

        it('should preference empty when not errored and incomplete data', () => {
            const merged = mergeStoreItems([data, data, empty]);
            expect(merged.loading).toBe(false);
            expect(merged.hasData).toBe(false);
            expect(merged.hasError).toBe(false);
        });

        it('should preference data when given no items', () => {
            const merged = mergeStoreItems([]);
            expect(merged.loading).toBe(false);
            expect(merged.hasData).toBe(true);
            expect(merged.hasError).toBe(false);
        });

    });

    describe('custom priorities: dl', () => {

        it('should preference data even if not all have data, even if errors exist', () => {
            const merged = mergeStoreItems([error, loading, data, empty], 'dl');
            expect(merged.loading).toBe(false);
            expect(merged.hasData).toBe(true);
            expect(merged.hasError).toBe(false);
        });

        it('should preference loading if nothing has data', () => {
            const merged = mergeStoreItems([error, loading, empty], 'dl');
            expect(merged.loading).toBe(true);
            expect(merged.hasData).toBe(false);
            expect(merged.hasError).toBe(false);
        });

        it('should preference empty if nothing has data or loading', () => {
            const merged = mergeStoreItems([error, empty], 'dl');
            expect(merged.loading).toBe(false);
            expect(merged.hasData).toBe(false);
            expect(merged.hasError).toBe(false);
        });
    });

    describe('custom priorities: dlf', () => {

        it('should preference data even if not all have data, even if errors exist', () => {
            const merged = mergeStoreItems([error, loading, data, empty], 'dlf');
            expect(merged.loading).toBe(false);
            expect(merged.hasData).toBe(true);
            expect(merged.hasError).toBe(false);
        });

        it('should preference loading if nothing has data', () => {
            const merged = mergeStoreItems([error, loading, empty], 'dlf');
            expect(merged.loading).toBe(true);
            expect(merged.hasData).toBe(false);
            expect(merged.hasError).toBe(false);
        });

        it('should preference DATA if nothing has data or loading due to the "f"', () => {
            const merged = mergeStoreItems([error, empty], 'dlf');
            expect(merged.loading).toBe(false);
            expect(merged.hasData).toBe(true);
            expect(merged.hasError).toBe(false);
        });
    });

    describe('undefined items', () => {

        it('should treat undefined storeItems as a non-request', () => {
            const merged = mergeStoreItems(undefined);

            expect(merged.loading).toBe(false);
            expect(merged.hasData).toBe(false);
            expect(merged.hasError).toBe(false);
        });

    });

});
