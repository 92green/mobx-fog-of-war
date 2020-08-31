import {toJS, computed} from 'mobx';
import type {Store, NextRequest, Receive} from './Store';
import {map} from 'rxjs/operators';
import {from} from 'rxjs';
import type {OperatorFunction} from 'rxjs';

//
// directly from mobx-utils
//

export interface ISubscription {
    unsubscribe(): void
}

export interface IStreamObserver<T> {
    next?(value: T): void
    error?(error: unknown): void
    complete?(): void
}

export interface IObservableStream<T> {
    subscribe(observer?: IStreamObserver<T> | null): ISubscription
    subscribe(observer?: ((value: T) => void) | null): ISubscription
}

function observableSymbol() {
    return (typeof Symbol === "function" && Symbol.observable) || "@@observable";
}

/* istanbul ignore next */
function toStream<T>(
    expression: () => T
): IObservableStream<T> {
    const computedValue = computed(expression);
    return {
        subscribe(observer?: IStreamObserver<T> | ((value: T) => void) | null): ISubscription {
            if ("function" === typeof observer) {
                return {
                    unsubscribe: computedValue.observe(
                        ({newValue}: { newValue: T }) => observer(newValue)
                    )
                };
            }
            if (observer && "object" === typeof observer && observer.next) {
                return {
                    unsubscribe: computedValue.observe(
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        ({newValue}: { newValue: T }) => observer.next!(newValue)
                    )
                };
            }
            return {
                // eslint-disable-next-line @typescript-eslint/no-empty-function
                unsubscribe: () => {}
            };
        },
        [observableSymbol()]: function (this: unknown) {
            return this;
        }
    };
}

//
// rxRequest
//

export const rxRequest = <Args,Data,Err>(operator: OperatorFunction<Args, Receive<Args,Data,Err>>) => {
    return (store: Store<Args,Data,Err>): void => {
        from(toStream((): NextRequest<Args> => toJS(store.nextRequest) as NextRequest<Args>))
            .pipe(
                map(item => item.args),
                operator
            )
            .subscribe(received => store.receive(received));
    };
};
