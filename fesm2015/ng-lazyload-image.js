import { InjectionToken, EventEmitter, Directive, ElementRef, NgZone, Inject, PLATFORM_ID, Input, Output, NgModule } from '@angular/core';
import { of, ReplaySubject, never, Subject, Observable, empty } from 'rxjs';
import { tap, filter, take, mergeMap, map, catchError, switchMap, startWith, sampleTime, share } from 'rxjs/operators';
import { isPlatformServer } from '@angular/common';

function lazyLoadImage(hooks, attributes) {
    return (evntObservable) => {
        return evntObservable.pipe(tap((data) => attributes.onStateChange.emit({ reason: 'observer-emit', data })), filter((event) => hooks.isVisible(event, attributes)), take(1), tap(() => attributes.onStateChange.emit({ reason: 'start-loading' })), mergeMap(() => hooks.loadImage(attributes)), tap(() => attributes.onStateChange.emit({ reason: 'mount-image' })), tap((imagePath) => hooks.setLoadedImage(imagePath, attributes)), tap(() => attributes.onStateChange.emit({ reason: 'loading-succeeded' })), map(() => true), catchError((error) => {
            attributes.onStateChange.emit({ reason: 'loading-failed', data: error });
            hooks.setErrorImage(error, attributes);
            return of(false);
        }), tap(() => {
            attributes.onStateChange.emit({ reason: 'finally' });
            hooks.finally(attributes);
        }));
    };
}

const LAZYLOAD_IMAGE_HOOKS = new InjectionToken('LazyLoadImageHooks');

function getNavigator() {
    return typeof window !== 'undefined' ? window.navigator : undefined;
}
function isChildOfPicture(element) {
    return Boolean(element.parentElement && element.parentElement.nodeName.toLowerCase() === 'picture');
}
function isImageElement(element) {
    return element.nodeName.toLowerCase() === 'img';
}
function setImage(element, imagePath, useSrcset) {
    if (isImageElement(element)) {
        if (useSrcset && 'srcset' in element) {
            element.srcset = imagePath;
        }
        else {
            element.src = imagePath;
        }
    }
    else {
        element.style.backgroundImage = `url('${imagePath}')`;
    }
    return element;
}
function setSources(attrName) {
    return (image) => {
        const sources = image.parentElement.getElementsByTagName('source');
        for (let i = 0; i < sources.length; i++) {
            const attrValue = sources[i].getAttribute(attrName);
            if (attrValue) {
                // Check if `srcset` is supported by the current browser
                if ('srcset' in sources[i]) {
                    sources[i].srcset = attrValue;
                }
                else {
                    sources[i].src = attrValue;
                }
            }
        }
    };
}
const setSourcesToDefault = setSources('defaultImage');
const setSourcesToLazy = setSources('lazyLoad');
const setSourcesToError = setSources('errorImage');
function setImageAndSources(setSourcesFn) {
    return (element, imagePath, useSrcset) => {
        if (isImageElement(element) && isChildOfPicture(element)) {
            setSourcesFn(element);
        }
        if (imagePath) {
            setImage(element, imagePath, useSrcset);
        }
    };
}
const setImageAndSourcesToDefault = setImageAndSources(setSourcesToDefault);
const setImageAndSourcesToLazy = setImageAndSources(setSourcesToLazy);
const setImageAndSourcesToError = setImageAndSources(setSourcesToError);

class Hooks {
    constructor() {
        this.navigator = getNavigator();
    }
    setPlatformId(platformId) {
        this.platformId = platformId;
    }
    onDestroy(attributes) { }
    onAttributeChange(newAttributes) { }
}

class LazyLoadImageDirective {
    constructor(el, ngZone, platformId, hooks) {
        this.onStateChange = new EventEmitter(); // Emits an event on every state change
        this.elementRef = el;
        this.ngZone = ngZone;
        this.propertyChanges$ = new ReplaySubject();
        this.hooks = hooks;
        this.hooks.setPlatformId(platformId);
        this.uid = Math.random().toString(36).substr(2, 9);
    }
    ngOnChanges() {
        if (this.debug === true && !this.debugSubscription) {
            this.debugSubscription = this.onStateChange.subscribe((e) => console.log(e));
        }
        this.propertyChanges$.next({
            element: this.elementRef.nativeElement,
            imagePath: this.lazyImage,
            defaultImagePath: this.defaultImage,
            errorImagePath: this.errorImage,
            useSrcset: this.useSrcset,
            offset: this.offset ? this.offset | 0 : 0,
            scrollContainer: this.scrollTarget,
            customObservable: this.customObservable,
            decode: this.decode,
            onStateChange: this.onStateChange,
            id: this.uid,
        });
    }
    ngAfterContentInit() {
        if (this.hooks.isDisabled()) {
            return null;
        }
        this.ngZone.runOutsideAngular(() => {
            this.loadSubscription = this.propertyChanges$
                .pipe(tap((attributes) => this.hooks.onAttributeChange(attributes)), tap((attributes) => attributes.onStateChange.emit({ reason: 'setup' })), tap((attributes) => this.hooks.setup(attributes)), switchMap((attributes) => {
                if (!attributes.imagePath) {
                    return never();
                }
                return this.hooks.getObservable(attributes).pipe(lazyLoadImage(this.hooks, attributes));
            }))
                .subscribe({
                next: () => null,
            });
        });
    }
    ngOnDestroy() {
        var _a, _b;
        this.propertyChanges$
            .pipe(take(1))
            .subscribe({ next: (attributes) => this.hooks.onDestroy(attributes) })
            .unsubscribe();
        (_a = this.loadSubscription) === null || _a === void 0 ? void 0 : _a.unsubscribe();
        (_b = this.debugSubscription) === null || _b === void 0 ? void 0 : _b.unsubscribe();
    }
}
LazyLoadImageDirective.decorators = [
    { type: Directive, args: [{
                selector: '[lazyLoad]',
            },] }
];
LazyLoadImageDirective.ctorParameters = () => [
    { type: ElementRef },
    { type: NgZone },
    { type: Object, decorators: [{ type: Inject, args: [PLATFORM_ID,] }] },
    { type: Hooks, decorators: [{ type: Inject, args: [LAZYLOAD_IMAGE_HOOKS,] }] }
];
LazyLoadImageDirective.propDecorators = {
    lazyImage: [{ type: Input, args: ['lazyLoad',] }],
    defaultImage: [{ type: Input }],
    errorImage: [{ type: Input }],
    scrollTarget: [{ type: Input }],
    customObservable: [{ type: Input }],
    offset: [{ type: Input }],
    useSrcset: [{ type: Input }],
    decode: [{ type: Input }],
    debug: [{ type: Input }],
    onStateChange: [{ type: Output }]
};

const cssClassNames = {
    loaded: 'ng-lazyloaded',
    loading: 'ng-lazyloading',
    failed: 'ng-failed-lazyloaded',
};
function removeCssClassName(element, cssClassName) {
    element.className = element.className.replace(cssClassName, '');
}
function addCssClassName(element, cssClassName) {
    if (!element.className.includes(cssClassName)) {
        element.className += ` ${cssClassName}`;
    }
}
function hasCssClassName(element, cssClassName) {
    return element.className && element.className.includes(cssClassName);
}

class SharedHooks extends Hooks {
    setup(attributes) {
        setImageAndSourcesToDefault(attributes.element, attributes.defaultImagePath, attributes.useSrcset);
        addCssClassName(attributes.element, cssClassNames.loading);
        if (hasCssClassName(attributes.element, cssClassNames.loaded)) {
            removeCssClassName(attributes.element, cssClassNames.loaded);
        }
    }
    finally(attributes) {
        addCssClassName(attributes.element, cssClassNames.loaded);
        removeCssClassName(attributes.element, cssClassNames.loading);
    }
    loadImage(attributes) {
        if (this.skipLazyLoading()) {
            // Set the image right away for bots for better SEO
            return [attributes.imagePath];
        }
        const { element, useSrcset, imagePath, decode } = attributes;
        let img;
        if (isImageElement(element) && isChildOfPicture(element)) {
            const parentClone = element.parentNode.cloneNode(true);
            img = parentClone.getElementsByTagName('img')[0];
            setSourcesToLazy(img);
            setImage(img, imagePath, useSrcset);
        }
        else {
            img = new Image();
            if (isImageElement(element) && element.referrerPolicy) {
                img.referrerPolicy = element.referrerPolicy;
            }
            if (isImageElement(element) && element.sizes) {
                img.sizes = element.sizes;
            }
            if (useSrcset && 'srcset' in img) {
                img.srcset = imagePath;
            }
            else {
                img.src = imagePath;
            }
        }
        if (decode && img.decode) {
            return img.decode().then(() => imagePath);
        }
        return new Promise((resolve, reject) => {
            img.onload = () => resolve(imagePath);
            img.onerror = () => reject(null);
        });
    }
    setErrorImage(error, attributes) {
        const { element, useSrcset, errorImagePath } = attributes;
        setImageAndSourcesToError(element, errorImagePath, useSrcset);
        addCssClassName(element, cssClassNames.failed);
    }
    setLoadedImage(imagePath, attributes) {
        const { element, useSrcset } = attributes;
        setImageAndSourcesToLazy(element, imagePath, useSrcset);
    }
    isDisabled() {
        // Disable if SSR and the user isn't a bot
        return isPlatformServer(this.platformId) && !this.isBot();
    }
    skipLazyLoading() {
        return this.isBot();
    }
    isBot() {
        var _a;
        if ((_a = this.navigator) === null || _a === void 0 ? void 0 : _a.userAgent) {
            return /googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora\ link\ preview|showyoubot|outbrain|pinterest\/0\.|pinterestbot|slackbot|vkShare|W3C_Validator|whatsapp|duckduckbot/i.test(this.navigator.userAgent);
        }
        return false;
    }
}

class IntersectionObserverHooks extends SharedHooks {
    constructor() {
        super(...arguments);
        this.observers = new WeakMap();
        this.intersectionSubject = new Subject();
        this.uniqKey = {};
    }
    getObservable(attributes) {
        if (this.skipLazyLoading()) {
            return of({ isIntersecting: true });
        }
        if (attributes.customObservable) {
            return attributes.customObservable;
        }
        const scrollContainerKey = attributes.scrollContainer || this.uniqKey;
        const options = {
            root: attributes.scrollContainer || null,
        };
        if (attributes.offset) {
            options.rootMargin = `${attributes.offset}px`;
        }
        let observer = this.observers.get(scrollContainerKey);
        if (!observer) {
            observer = new IntersectionObserver((entrys) => this.loadingCallback(entrys), options);
            this.observers.set(scrollContainerKey, observer);
        }
        observer.observe(attributes.element);
        return Observable.create((obs) => {
            const subscription = this.intersectionSubject.pipe(filter((entry) => entry.target === attributes.element)).subscribe(obs);
            return () => {
                subscription.unsubscribe();
                observer.unobserve(attributes.element);
            };
        });
    }
    isVisible(event) {
        return event.isIntersecting;
    }
    loadingCallback(entrys) {
        entrys.forEach((entry) => this.intersectionSubject.next(entry));
    }
}

class LazyLoadImageModule {
}
LazyLoadImageModule.decorators = [
    { type: NgModule, args: [{
                declarations: [LazyLoadImageDirective],
                exports: [LazyLoadImageDirective],
                providers: [{ provide: LAZYLOAD_IMAGE_HOOKS, useClass: IntersectionObserverHooks }],
            },] }
];

class Rect {
    constructor(left, top, right, bottom) {
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
    }
    static fromElement(element) {
        const { left, top, right, bottom } = element.getBoundingClientRect();
        if (left === 0 && top === 0 && right === 0 && bottom === 0) {
            return Rect.empty;
        }
        else {
            return new Rect(left, top, right, bottom);
        }
    }
    static fromWindow(_window) {
        return new Rect(0, 0, _window.innerWidth, _window.innerHeight);
    }
    inflate(inflateBy) {
        this.left -= inflateBy;
        this.top -= inflateBy;
        this.right += inflateBy;
        this.bottom += inflateBy;
    }
    intersectsWith(rect) {
        return rect.left < this.right && this.left < rect.right && rect.top < this.bottom && this.top < rect.bottom;
    }
    getIntersectionWith(rect) {
        const left = Math.max(this.left, rect.left);
        const top = Math.max(this.top, rect.top);
        const right = Math.min(this.right, rect.right);
        const bottom = Math.min(this.bottom, rect.bottom);
        if (right >= left && bottom >= top) {
            return new Rect(left, top, right, bottom);
        }
        else {
            return Rect.empty;
        }
    }
}
Rect.empty = new Rect(0, 0, 0, 0);

class ScrollHooks extends SharedHooks {
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

/**
 * Generated bundle index. Do not edit.
 */

export { Hooks, IntersectionObserverHooks, LAZYLOAD_IMAGE_HOOKS, LazyLoadImageModule, ScrollHooks, SharedHooks, LazyLoadImageDirective as ɵa };
//# sourceMappingURL=ng-lazyload-image.js.map
