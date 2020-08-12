import { empty, Observable, of } from 'rxjs';
import { sampleTime, share, startWith } from 'rxjs/operators';
import { SharedHooks } from '../shared-hooks/hooks';
import { Rect } from './rect';
export class ScrollHooks extends SharedHooks {
    constructor(getWindow = () => window) {
        super();
        this.scrollListeners = new WeakMap();
        // Only create one scroll listener per target and share the observable.
        // Typical, there will only be one observable per application
        this.getScrollListener = (scrollTarget) => {
            if (!scrollTarget || typeof scrollTarget.addEventListener !== 'function') {
                console.warn('`addEventListener` on ' + scrollTarget + ' (scrollTarget) is not a function. Skipping this target');
                return empty();
            }
            const scrollListener = this.scrollListeners.get(scrollTarget);
            if (scrollListener) {
                return scrollListener;
            }
            const srollEvent = Observable.create((observer) => {
                const eventName = 'scroll';
                const handler = (event) => observer.next(event);
                const options = { passive: true, capture: false };
                scrollTarget.addEventListener(eventName, handler, options);
                return () => scrollTarget.removeEventListener(eventName, handler, options);
            });
            const listener = this.sampleObservable(srollEvent);
            this.scrollListeners.set(scrollTarget, listener);
            return listener;
        };
        this.getWindow = getWindow;
    }
    getObservable(attributes) {
        if (this.skipLazyLoading()) {
            return of('load');
        }
        else if (attributes.customObservable) {
            return attributes.customObservable.pipe(startWith(''));
        }
        else if (attributes.scrollContainer) {
            return this.getScrollListener(attributes.scrollContainer);
        }
        return this.getScrollListener(this.getWindow());
    }
    isVisible(event, attributes) {
        const elementBounds = Rect.fromElement(attributes.element);
        if (elementBounds === Rect.empty) {
            return false;
        }
        const windowBounds = Rect.fromWindow(this.getWindow());
        elementBounds.inflate(attributes.offset);
        if (attributes.scrollContainer) {
            const scrollContainerBounds = Rect.fromElement(attributes.scrollContainer);
            const intersection = scrollContainerBounds.getIntersectionWith(windowBounds);
            return elementBounds.intersectsWith(intersection);
        }
        else {
            return elementBounds.intersectsWith(windowBounds);
        }
    }
    sampleObservable(obs, scheduler) {
        return obs.pipe(sampleTime(100, scheduler), share(), startWith(''));
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9va3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvc2Nyb2xsLWhvb2tzL2hvb2tzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBVyxNQUFNLE1BQU0sQ0FBQztBQUN0RCxPQUFPLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQztBQUM5RCxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFFcEQsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLFFBQVEsQ0FBQztBQUU5QixNQUFNLE9BQU8sV0FBWSxTQUFRLFdBQTJCO0lBSTFELFlBQVksU0FBUyxHQUFHLEdBQUcsRUFBRSxDQUFDLE1BQU07UUFDbEMsS0FBSyxFQUFFLENBQUM7UUFITyxvQkFBZSxHQUFHLElBQUksT0FBTyxFQUF3QixDQUFDO1FBdUN2RSx1RUFBdUU7UUFDdkUsNkRBQTZEO1FBQzdELHNCQUFpQixHQUFHLENBQUMsWUFBbUMsRUFBMEIsRUFBRTtZQUNsRixJQUFJLENBQUMsWUFBWSxJQUFJLE9BQU8sWUFBWSxDQUFDLGdCQUFnQixLQUFLLFVBQVUsRUFBRTtnQkFDeEUsT0FBTyxDQUFDLElBQUksQ0FBQyx3QkFBd0IsR0FBRyxZQUFZLEdBQUcseURBQXlELENBQUMsQ0FBQztnQkFDbEgsT0FBTyxLQUFLLEVBQUUsQ0FBQzthQUNoQjtZQUNELE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzlELElBQUksY0FBYyxFQUFFO2dCQUNsQixPQUFPLGNBQWMsQ0FBQzthQUN2QjtZQUVELE1BQU0sVUFBVSxHQUFzQixVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBd0IsRUFBRSxFQUFFO2dCQUNuRixNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUM7Z0JBQzNCLE1BQU0sT0FBTyxHQUFHLENBQUMsS0FBWSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUN2RCxNQUFNLE9BQU8sR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDO2dCQUNsRCxZQUFZLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDM0QsT0FBTyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsbUJBQW1CLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztZQUM3RSxDQUFDLENBQUMsQ0FBQztZQUVILE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNuRCxJQUFJLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDakQsT0FBTyxRQUFRLENBQUM7UUFDbEIsQ0FBQyxDQUFDO1FBMURBLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0lBQzdCLENBQUM7SUFFRCxhQUFhLENBQUMsVUFBc0M7UUFDbEQsSUFBSSxJQUFJLENBQUMsZUFBZSxFQUFFLEVBQUU7WUFDMUIsT0FBTyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDbkI7YUFBTSxJQUFJLFVBQVUsQ0FBQyxnQkFBZ0IsRUFBRTtZQUN0QyxPQUFPLFVBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDeEQ7YUFBTSxJQUFJLFVBQVUsQ0FBQyxlQUFlLEVBQUU7WUFDckMsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1NBQzNEO1FBQ0QsT0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVELFNBQVMsQ0FBQyxLQUFxQixFQUFFLFVBQXNCO1FBQ3JELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNELElBQUksYUFBYSxLQUFLLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDaEMsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUNELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDdkQsYUFBYSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFekMsSUFBSSxVQUFVLENBQUMsZUFBZSxFQUFFO1lBQzlCLE1BQU0scUJBQXFCLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDM0UsTUFBTSxZQUFZLEdBQUcscUJBQXFCLENBQUMsbUJBQW1CLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDN0UsT0FBTyxhQUFhLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQ25EO2FBQU07WUFDTCxPQUFPLGFBQWEsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDbkQ7SUFDSCxDQUFDO0lBRUQsZ0JBQWdCLENBQUksR0FBa0IsRUFBRSxTQUFlO1FBQ3JELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7Q0EwQkYiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBlbXB0eSwgT2JzZXJ2YWJsZSwgb2YsIFN1YmplY3QgfSBmcm9tICdyeGpzJztcbmltcG9ydCB7IHNhbXBsZVRpbWUsIHNoYXJlLCBzdGFydFdpdGggfSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgeyBTaGFyZWRIb29rcyB9IGZyb20gJy4uL3NoYXJlZC1ob29rcy9ob29rcyc7XG5pbXBvcnQgeyBBdHRyaWJ1dGVzIH0gZnJvbSAnLi4vdHlwZXMnO1xuaW1wb3J0IHsgUmVjdCB9IGZyb20gJy4vcmVjdCc7XG5cbmV4cG9ydCBjbGFzcyBTY3JvbGxIb29rcyBleHRlbmRzIFNoYXJlZEhvb2tzPEV2ZW50IHwgc3RyaW5nPiB7XG4gIHByaXZhdGUgcmVhZG9ubHkgZ2V0V2luZG93OiAoKSA9PiBXaW5kb3c7XG4gIHByaXZhdGUgcmVhZG9ubHkgc2Nyb2xsTGlzdGVuZXJzID0gbmV3IFdlYWtNYXA8YW55LCBPYnNlcnZhYmxlPGFueT4+KCk7XG5cbiAgY29uc3RydWN0b3IoZ2V0V2luZG93ID0gKCkgPT4gd2luZG93KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmdldFdpbmRvdyA9IGdldFdpbmRvdztcbiAgfVxuXG4gIGdldE9ic2VydmFibGUoYXR0cmlidXRlczogQXR0cmlidXRlczxFdmVudCB8IHN0cmluZz4pOiBPYnNlcnZhYmxlPEV2ZW50IHwgc3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuc2tpcExhenlMb2FkaW5nKCkpIHtcbiAgICAgIHJldHVybiBvZignbG9hZCcpO1xuICAgIH0gZWxzZSBpZiAoYXR0cmlidXRlcy5jdXN0b21PYnNlcnZhYmxlKSB7XG4gICAgICByZXR1cm4gYXR0cmlidXRlcy5jdXN0b21PYnNlcnZhYmxlLnBpcGUoc3RhcnRXaXRoKCcnKSk7XG4gICAgfSBlbHNlIGlmIChhdHRyaWJ1dGVzLnNjcm9sbENvbnRhaW5lcikge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0U2Nyb2xsTGlzdGVuZXIoYXR0cmlidXRlcy5zY3JvbGxDb250YWluZXIpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5nZXRTY3JvbGxMaXN0ZW5lcih0aGlzLmdldFdpbmRvdygpKTtcbiAgfVxuXG4gIGlzVmlzaWJsZShldmVudDogRXZlbnQgfCBzdHJpbmcsIGF0dHJpYnV0ZXM6IEF0dHJpYnV0ZXMpOiBib29sZWFuIHtcbiAgICBjb25zdCBlbGVtZW50Qm91bmRzID0gUmVjdC5mcm9tRWxlbWVudChhdHRyaWJ1dGVzLmVsZW1lbnQpO1xuICAgIGlmIChlbGVtZW50Qm91bmRzID09PSBSZWN0LmVtcHR5KSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbnN0IHdpbmRvd0JvdW5kcyA9IFJlY3QuZnJvbVdpbmRvdyh0aGlzLmdldFdpbmRvdygpKTtcbiAgICBlbGVtZW50Qm91bmRzLmluZmxhdGUoYXR0cmlidXRlcy5vZmZzZXQpO1xuXG4gICAgaWYgKGF0dHJpYnV0ZXMuc2Nyb2xsQ29udGFpbmVyKSB7XG4gICAgICBjb25zdCBzY3JvbGxDb250YWluZXJCb3VuZHMgPSBSZWN0LmZyb21FbGVtZW50KGF0dHJpYnV0ZXMuc2Nyb2xsQ29udGFpbmVyKTtcbiAgICAgIGNvbnN0IGludGVyc2VjdGlvbiA9IHNjcm9sbENvbnRhaW5lckJvdW5kcy5nZXRJbnRlcnNlY3Rpb25XaXRoKHdpbmRvd0JvdW5kcyk7XG4gICAgICByZXR1cm4gZWxlbWVudEJvdW5kcy5pbnRlcnNlY3RzV2l0aChpbnRlcnNlY3Rpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZWxlbWVudEJvdW5kcy5pbnRlcnNlY3RzV2l0aCh3aW5kb3dCb3VuZHMpO1xuICAgIH1cbiAgfVxuXG4gIHNhbXBsZU9ic2VydmFibGU8VD4ob2JzOiBPYnNlcnZhYmxlPFQ+LCBzY2hlZHVsZXI/OiBhbnkpOiBPYnNlcnZhYmxlPFQgfCAnJz4ge1xuICAgIHJldHVybiBvYnMucGlwZShzYW1wbGVUaW1lKDEwMCwgc2NoZWR1bGVyKSwgc2hhcmUoKSwgc3RhcnRXaXRoKCcnKSk7XG4gIH1cblxuICAvLyBPbmx5IGNyZWF0ZSBvbmUgc2Nyb2xsIGxpc3RlbmVyIHBlciB0YXJnZXQgYW5kIHNoYXJlIHRoZSBvYnNlcnZhYmxlLlxuICAvLyBUeXBpY2FsLCB0aGVyZSB3aWxsIG9ubHkgYmUgb25lIG9ic2VydmFibGUgcGVyIGFwcGxpY2F0aW9uXG4gIGdldFNjcm9sbExpc3RlbmVyID0gKHNjcm9sbFRhcmdldD86IEhUTUxFbGVtZW50IHwgV2luZG93KTogT2JzZXJ2YWJsZTxFdmVudCB8ICcnPiA9PiB7XG4gICAgaWYgKCFzY3JvbGxUYXJnZXQgfHwgdHlwZW9mIHNjcm9sbFRhcmdldC5hZGRFdmVudExpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ2BhZGRFdmVudExpc3RlbmVyYCBvbiAnICsgc2Nyb2xsVGFyZ2V0ICsgJyAoc2Nyb2xsVGFyZ2V0KSBpcyBub3QgYSBmdW5jdGlvbi4gU2tpcHBpbmcgdGhpcyB0YXJnZXQnKTtcbiAgICAgIHJldHVybiBlbXB0eSgpO1xuICAgIH1cbiAgICBjb25zdCBzY3JvbGxMaXN0ZW5lciA9IHRoaXMuc2Nyb2xsTGlzdGVuZXJzLmdldChzY3JvbGxUYXJnZXQpO1xuICAgIGlmIChzY3JvbGxMaXN0ZW5lcikge1xuICAgICAgcmV0dXJuIHNjcm9sbExpc3RlbmVyO1xuICAgIH1cblxuICAgIGNvbnN0IHNyb2xsRXZlbnQ6IE9ic2VydmFibGU8RXZlbnQ+ID0gT2JzZXJ2YWJsZS5jcmVhdGUoKG9ic2VydmVyOiBTdWJqZWN0PEV2ZW50PikgPT4ge1xuICAgICAgY29uc3QgZXZlbnROYW1lID0gJ3Njcm9sbCc7XG4gICAgICBjb25zdCBoYW5kbGVyID0gKGV2ZW50OiBFdmVudCkgPT4gb2JzZXJ2ZXIubmV4dChldmVudCk7XG4gICAgICBjb25zdCBvcHRpb25zID0geyBwYXNzaXZlOiB0cnVlLCBjYXB0dXJlOiBmYWxzZSB9O1xuICAgICAgc2Nyb2xsVGFyZ2V0LmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBoYW5kbGVyLCBvcHRpb25zKTtcbiAgICAgIHJldHVybiAoKSA9PiBzY3JvbGxUYXJnZXQucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGhhbmRsZXIsIG9wdGlvbnMpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgbGlzdGVuZXIgPSB0aGlzLnNhbXBsZU9ic2VydmFibGUoc3JvbGxFdmVudCk7XG4gICAgdGhpcy5zY3JvbGxMaXN0ZW5lcnMuc2V0KHNjcm9sbFRhcmdldCwgbGlzdGVuZXIpO1xuICAgIHJldHVybiBsaXN0ZW5lcjtcbiAgfTtcbn1cbiJdfQ==