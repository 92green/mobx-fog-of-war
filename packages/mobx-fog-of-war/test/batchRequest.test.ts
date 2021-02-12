import {Store, batchRequest} from '../src/index';
import type {Receive} from '../src/index';
import {mocked} from 'ts-jest/utils';

jest.useFakeTimers();

type Place = {
    id: string;
    name: string;
};

type PlaceArgs = string;

const fakeRequest = async (argsArray: PlaceArgs[]): Promise<Receive<PlaceArgs,Place|undefined,string>[]> => {
    return argsArray.map(args => {
        return {
            args,
            data: {
                id: args,
                name: `${args}!`
            }
        };
    });
};

describe('batchRequest', () => {

    describe('basic buffer and batch', () => {

        it('should batch requested items', async () => {

            const requester = jest.fn(fakeRequest);

            const placeStore = new Store<PlaceArgs,Place,string>({
                request: batchRequest(requester)
            });

            placeStore.get('one');
            placeStore.get('two');
            placeStore.get('three');

            // we are still buffering, so nothing should be requested yet
            expect(requester).toHaveBeenCalledTimes(0);

            // move time forward
            jest.advanceTimersByTime(15);

            // request should be called now
            expect(requester).toHaveBeenCalledTimes(1);

            const result = await Promise.all([
                placeStore.read('one').promise(),
                placeStore.read('two').promise(),
                placeStore.read('three').promise()
            ]);

            expect(result.map(r => r.data)).toEqual([
                {id: 'one', name: 'one!'},
                {id: 'two', name: 'two!'},
                {id: 'three', name: 'three!'}
            ]);

            expect(requester).toHaveBeenCalledTimes(1);
            expect(mocked(requester).mock.calls[0][0]).toEqual(['one','two','three']);
        });

        it('should batch by default', async () => {

            const requester = jest.fn(fakeRequest);

            const placeStore = new Store<PlaceArgs,Place,string>({
                request: batchRequest(requester, {bufferTime: 1})
            });

            for(let i = 0; i < 60; i++) {
                placeStore.get(`r${i}`);
            }

            await placeStore.read('r0').promise();

            expect(requester).toHaveBeenCalledTimes(1);
            expect(mocked(requester).mock.calls[0][0][0]).toBe('r0');
            expect(mocked(requester).mock.calls[0][0].length).toBe(25);

            await placeStore.read('r25').promise();

            expect(requester).toHaveBeenCalledTimes(2);
            expect(mocked(requester).mock.calls[1][0][0]).toBe('r25');
            expect(mocked(requester).mock.calls[1][0].length).toBe(25);

            jest.advanceTimersByTime(9999999);

            await placeStore.read('r50').promise();

            expect(requester).toHaveBeenCalledTimes(3);
            expect(mocked(requester).mock.calls[2][0][0]).toBe('r50');
            expect(mocked(requester).mock.calls[2][0].length).toBe(10);
        });

    });

    describe('options', () => {

        it('should have customiseable buffer time', async () => {

            const requester = jest.fn(fakeRequest);

            const placeStore = new Store<PlaceArgs,Place,string>({
                request: batchRequest(requester, {bufferTime: 1})
            });

            placeStore.get('one');
            placeStore.get('two');
            placeStore.get('three');

            // we are still buffering, so nothing should be requested yet
            expect(requester).toHaveBeenCalledTimes(0);

            // move time forward
            jest.advanceTimersByTime(500);

            // still no request
            expect(requester).toHaveBeenCalledTimes(0);

            // move time forward
            jest.advanceTimersByTime(600);

            // request should be called now
            expect(requester).toHaveBeenCalledTimes(1);
        });



        it('should have customeable batch size', async () => {

            const requester = jest.fn(fakeRequest);

            const placeStore = new Store<PlaceArgs,Place,string>({
                request: batchRequest(requester, {batchSize: 10})
            });

            for(let i = 0; i < 25; i++) {
                placeStore.get(`r${i}`);
            }

            await placeStore.read('r0').promise();

            expect(requester).toHaveBeenCalledTimes(1);
            expect(mocked(requester).mock.calls[0][0][0]).toBe('r0');
            expect(mocked(requester).mock.calls[0][0].length).toBe(10);

            await placeStore.read('r10').promise();

            expect(requester).toHaveBeenCalledTimes(2);
            expect(mocked(requester).mock.calls[1][0][0]).toBe('r10');
            expect(mocked(requester).mock.calls[1][0].length).toBe(10);

            jest.advanceTimersByTime(9999999);

            await placeStore.read('r20').promise();

            expect(requester).toHaveBeenCalledTimes(3);
            expect(mocked(requester).mock.calls[2][0][0]).toBe('r20');
            expect(mocked(requester).mock.calls[2][0].length).toBe(5);
        });
    });

    describe('errors', () => {

        it('should receive error', async () => {

            const placeStore = new Store<PlaceArgs,Place,string>({
                request: batchRequest(async (_argsArray: PlaceArgs[]): Promise<Receive<PlaceArgs,Place|undefined,string>[]> => {
                    throw "ERROR TIME";
                })
            });

            placeStore.get('one');
            placeStore.get('two');
            jest.advanceTimersByTime(15);

            const result = await Promise.all([
                await placeStore.read('one').promise(),
                await placeStore.read('two').promise()
            ]);

            expect(result[0].error).toBe('ERROR TIME');
            expect(result[1].error).toBe('ERROR TIME');
        });
    });


});
