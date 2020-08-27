import {rxBatch} from '../src/index';
import {mocked} from 'ts-jest/utils';
import {TestScheduler} from 'rxjs/testing';
import {of, throwError} from 'rxjs';

interface Data {
    id: string;
    name: string;
}

describe('rxBatch', () => {
    it('should buffer and batch', async () => {

        const testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });

        testScheduler.run(helpers => {
            const {cold, expectObservable, expectSubscriptions} = helpers;

            const requester = jest
                .fn()
                .mockImplementationOnce(() => {
                    return of([
                        {id: 'c', name: 'C'},
                        {id: 'a', name: 'A'},
                        {id: 'b', name: 'B'}
                    ]);
                })
                .mockImplementationOnce(() => {
                    return of([
                        {id: 'e', name: 'E'},
                        {id: 'd', name: 'D'}
                    ]);
                });

            const values = {
                a: {
                    args: 'a',
                    data: {
                        id: 'a',
                        name: 'A'
                    }
                },
                b: {
                    args: 'b',
                    data: {
                        id: 'b',
                        name: 'B'
                    }
                },
                c: {
                    args: 'c',
                    data: {
                        id: 'c',
                        name: 'C'
                    }
                },
                d: {
                    args: 'd',
                    data: {
                        id: 'd',
                        name: 'D'
                    }
                },
                e: {
                    args: 'e',
                    data: {
                        id: 'e',
                        name: 'E'
                    }
                }
            };

            const inputObs = cold('-abcd-e-----------|');
            const subs =          '^-----------------!';
            const expected =      '----------(abcde)-|';

            expectObservable(
                inputObs.pipe(
                    rxBatch({
                        request: mocked(requester),
                        bufferTime: 10,
                        batch: 3,
                        getArgs: (item: Data) => item.id,
                        requestError: e => e,
                        missingError: () => 'missing'
                    })
                )
            ).toBe(expected, values);

            expectSubscriptions(inputObs.subscriptions).toBe(subs);
        });
    });

    it('should cope with errors', async () => {

        const testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });

        testScheduler.run(helpers => {
            const {cold, expectObservable, expectSubscriptions} = helpers;

            const requester = jest.fn(() => throwError('oops!'));

            const values = {
                a: {
                    args: 'a',
                    error: 'error: oops!'
                },
                b: {
                    args: 'b',
                    error: 'error: oops!'
                },
                c: {
                    args: 'c',
                    error: 'error: oops!'
                },
                d: {
                    args: 'd',
                    error: 'error: oops!'
                }
            };

            const inputObs = cold('-ab-------------cd-------|');
            const subs =          '^------------------------!';
            const expected =      '----------(ab)------(cd)-|';

            expectObservable(
                inputObs.pipe(
                    rxBatch({
                        request: mocked(requester),
                        bufferTime: 10,
                        batch: 3,
                        getArgs: (item: Data) => item.id,
                        requestError: e => `error: ${e}`,
                        missingError: () => 'missing'
                    })
                )
            ).toBe(expected, values);

            expectSubscriptions(inputObs.subscriptions).toBe(subs);
        });
    });

    it('should return missing if item not found from request', async () => {

        const testScheduler = new TestScheduler((actual, expected) => {
            expect(actual).toEqual(expected);
        });

        testScheduler.run(helpers => {
            const {cold, expectObservable, expectSubscriptions} = helpers;

            const requester = jest
                .fn()
                .mockImplementationOnce(() => {
                    return of([
                        {id: 'a', name: 'A'},
                        {id: 'b', name: 'B'}
                    ]);
                });

            const values = {
                a: {
                    args: 'a',
                    data: {
                        id: 'a',
                        name: 'A'
                    }
                },
                b: {
                    args: 'b',
                    data: {
                        id: 'b',
                        name: 'B'
                    }
                },
                c: {
                    args: 'c',
                    error: 'missing'
                }
            };

            const inputObs = cold('-abc------------|');
            const subs =          '^---------------!';
            const expected =      '----------(abc)-|';

            expectObservable(
                inputObs.pipe(
                    rxBatch({
                        request: mocked(requester),
                        bufferTime: 10,
                        batch: 3,
                        getArgs: (item: Data) => item.id,
                        requestError: e => e,
                        missingError: () => 'missing'
                    })
                )
            ).toBe(expected, values);

            expectSubscriptions(inputObs.subscriptions).toBe(subs);
        });
    });
});
