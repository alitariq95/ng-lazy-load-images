(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@angular/core'), require('rxjs'), require('rxjs/operators'), require('@angular/common')) :
    typeof define === 'function' && define.amd ? define('ng-lazyload-image', ['exports', '@angular/core', 'rxjs', 'rxjs/operators', '@angular/common'], factory) :
    (global = global || self, factory(global['ng-lazyload-image'] = {}, global.ng.core, global.rxjs, global.rxjs.operators, global.ng.common));
}(this, (function (exports, core, rxjs, operators, common) { 'use strict';

    function lazyLoadImage(hooks, attributes) {
        return function (evntObservable) {
            return evntObservable.pipe(operators.tap(function (data) { return attributes.onStateChange.emit({ reason: 'observer-emit', data: data }); }), operators.filter(function (event) { return hooks.isVisible(event, attributes); }), operators.take(1), operators.tap(function () { return attributes.onStateChange.emit({ reason: 'start-loading' }); }), operators.mergeMap(function () { return hooks.loadImage(attributes); }), operators.tap(function () { return attributes.onStateChange.emit({ reason: 'mount-image' }); }), operators.tap(function (imagePath) { return hooks.setLoadedImage(imagePath, attributes); }), operators.tap(function () { return attributes.onStateChange.emit({ reason: 'loading-succeeded' }); }), operators.map(function () { return true; }), operators.catchError(function (error) {
                attributes.onStateChange.emit({ reason: 'loading-failed', data: error });
                hooks.setErrorImage(error, attributes);
                return rxjs.of(false);
            }), operators.tap(function () {
                attributes.onStateChange.emit({ reason: 'finally' });
                hooks.finally(attributes);
            }));
        };
    }

    var LAZYLOAD_IMAGE_HOOKS = new core.InjectionToken('LazyLoadImageHooks');

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
            element.style.backgroundImage = "url('" + imagePath + "')";
        }
        return element;
    }
    function setSources(attrName) {
        return function (image) {
            var sources = image.parentElement.getElementsByTagName('source');
            for (var i = 0; i < sources.length; i++) {
                var attrValue = sources[i].getAttribute(attrName);
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
    var setSourcesToDefault = setSources('defaultImage');
    var setSourcesToLazy = setSources('lazyLoad');
    var setSourcesToError = setSources('errorImage');
    function setImageAndSources(setSourcesFn) {
        return function (element, imagePath, useSrcset) {
            if (isImageElement(element) && isChildOfPicture(element)) {
                setSourcesFn(element);
            }
            if (imagePath) {
                setImage(element, imagePath, useSrcset);
            }
        };
    }
    var setImageAndSourcesToDefault = setImageAndSources(setSourcesToDefault);
    var setImageAndSourcesToLazy = setImageAndSources(setSourcesToLazy);
    var setImageAndSourcesToError = setImageAndSources(setSourcesToError);

    var Hooks = /** @class */ (function () {
        function Hooks() {
            this.navigator = getNavigator();
        }
        Hooks.prototype.setPlatformId = function (platformId) {
            this.platformId = platformId;
        };
        Hooks.prototype.onDestroy = function (attributes) { };
        Hooks.prototype.onAttributeChange = function (newAttributes) { };
        return Hooks;
    }());

    var LazyLoadImageDirective = /** @class */ (function () {
        function LazyLoadImageDirective(el, ngZone, platformId, hooks) {
            this.onStateChange = new core.EventEmitter(); // Emits an event on every state change
            this.elementRef = el;
            this.ngZone = ngZone;
            this.propertyChanges$ = new rxjs.ReplaySubject();
            this.hooks = hooks;
            this.hooks.setPlatformId(platformId);
            this.uid = Math.random().toString(36).substr(2, 9);
        }
        LazyLoadImageDirective.prototype.ngOnChanges = function () {
            if (this.debug === true && !this.debugSubscription) {
                this.debugSubscription = this.onStateChange.subscribe(function (e) { return console.log(e); });
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
        };
        LazyLoadImageDirective.prototype.ngAfterContentInit = function () {
            var _this = this;
            if (this.hooks.isDisabled()) {
                return null;
            }
            this.ngZone.runOutsideAngular(function () {
                _this.loadSubscription = _this.propertyChanges$
                    .pipe(operators.tap(function (attributes) { return _this.hooks.onAttributeChange(attributes); }), operators.tap(function (attributes) { return attributes.onStateChange.emit({ reason: 'setup' }); }), operators.tap(function (attributes) { return _this.hooks.setup(attributes); }), operators.switchMap(function (attributes) {
                    if (!attributes.imagePath) {
                        return rxjs.never();
                    }
                    return _this.hooks.getObservable(attributes).pipe(lazyLoadImage(_this.hooks, attributes));
                }))
                    .subscribe({
                    next: function () { return null; },
                });
            });
        };
        LazyLoadImageDirective.prototype.ngOnDestroy = function () {
            var _this = this;
            var _a, _b;
            this.propertyChanges$
                .pipe(operators.take(1))
                .subscribe({ next: function (attributes) { return _this.hooks.onDestroy(attributes); } })
                .unsubscribe();
            (_a = this.loadSubscription) === null || _a === void 0 ? void 0 : _a.unsubscribe();
            (_b = this.debugSubscription) === null || _b === void 0 ? void 0 : _b.unsubscribe();
        };
        return LazyLoadImageDirective;
    }());
    LazyLoadImageDirective.decorators = [
        { type: core.Directive, args: [{
                    selector: '[lazyLoad]',
                },] }
    ];
    LazyLoadImageDirective.ctorParameters = function () { return [
        { type: core.ElementRef },
        { type: core.NgZone },
        { type: Object, decorators: [{ type: core.Inject, args: [core.PLATFORM_ID,] }] },
        { type: Hooks, decorators: [{ type: core.Inject, args: [LAZYLOAD_IMAGE_HOOKS,] }] }
    ]; };
    LazyLoadImageDirective.propDecorators = {
        lazyImage: [{ type: core.Input, args: ['lazyLoad',] }],
        defaultImage: [{ type: core.Input }],
        errorImage: [{ type: core.Input }],
        scrollTarget: [{ type: core.Input }],
        customObservable: [{ type: core.Input }],
        offset: [{ type: core.Input }],
        useSrcset: [{ type: core.Input }],
        decode: [{ type: core.Input }],
        debug: [{ type: core.Input }],
        onStateChange: [{ type: core.Output }]
    };

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b)
                if (b.hasOwnProperty(p))
                    d[p] = b[p]; };
        return extendStatics(d, b);
    };
    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }
    var __assign = function () {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s)
                    if (Object.prototype.hasOwnProperty.call(s, p))
                        t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };
    function __rest(s, e) {
        var t = {};
        for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
                t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }
    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function")
            r = Reflect.decorate(decorators, target, key, desc);
        else
            for (var i = decorators.length - 1; i >= 0; i--)
                if (d = decorators[i])
                    r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }
    function __param(paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); };
    }
    function __metadata(metadataKey, metadataValue) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function")
            return Reflect.metadata(metadataKey, metadataValue);
    }
    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try {
                step(generator.next(value));
            }
            catch (e) {
                reject(e);
            } }
            function rejected(value) { try {
                step(generator["throw"](value));
            }
            catch (e) {
                reject(e);
            } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }
    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function () { if (t[0] & 1)
                throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f)
                throw new TypeError("Generator is already executing.");
            while (_)
                try {
                    if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
                        return t;
                    if (y = 0, t)
                        op = [op[0] & 2, t.value];
                    switch (op[0]) {
                        case 0:
                        case 1:
                            t = op;
                            break;
                        case 4:
                            _.label++;
                            return { value: op[1], done: false };
                        case 5:
                            _.label++;
                            y = op[1];
                            op = [0];
                            continue;
                        case 7:
                            op = _.ops.pop();
                            _.trys.pop();
                            continue;
                        default:
                            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                                _ = 0;
                                continue;
                            }
                            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                                _.label = op[1];
                                break;
                            }
                            if (op[0] === 6 && _.label < t[1]) {
                                _.label = t[1];
                                t = op;
                                break;
                            }
                            if (t && _.label < t[2]) {
                                _.label = t[2];
                                _.ops.push(op);
                                break;
                            }
                            if (t[2])
                                _.ops.pop();
                            _.trys.pop();
                            continue;
                    }
                    op = body.call(thisArg, _);
                }
                catch (e) {
                    op = [6, e];
                    y = 0;
                }
                finally {
                    f = t = 0;
                }
            if (op[0] & 5)
                throw op[1];
            return { value: op[0] ? op[1] : void 0, done: true };
        }
    }
    var __createBinding = Object.create ? (function (o, m, k, k2) {
        if (k2 === undefined)
            k2 = k;
        Object.defineProperty(o, k2, { enumerable: true, get: function () { return m[k]; } });
    }) : (function (o, m, k, k2) {
        if (k2 === undefined)
            k2 = k;
        o[k2] = m[k];
    });
    function __exportStar(m, exports) {
        for (var p in m)
            if (p !== "default" && !exports.hasOwnProperty(p))
                __createBinding(exports, m, p);
    }
    function __values(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m)
            return m.call(o);
        if (o && typeof o.length === "number")
            return {
                next: function () {
                    if (o && i >= o.length)
                        o = void 0;
                    return { value: o && o[i++], done: !o };
                }
            };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
    }
    function __read(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m)
            return o;
        var i = m.call(o), r, ar = [], e;
        try {
            while ((n === void 0 || n-- > 0) && !(r = i.next()).done)
                ar.push(r.value);
        }
        catch (error) {
            e = { error: error };
        }
        finally {
            try {
                if (r && !r.done && (m = i["return"]))
                    m.call(i);
            }
            finally {
                if (e)
                    throw e.error;
            }
        }
        return ar;
    }
    function __spread() {
        for (var ar = [], i = 0; i < arguments.length; i++)
            ar = ar.concat(__read(arguments[i]));
        return ar;
    }
    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++)
            s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }
    ;
    function __await(v) {
        return this instanceof __await ? (this.v = v, this) : new __await(v);
    }
    function __asyncGenerator(thisArg, _arguments, generator) {
        if (!Symbol.asyncIterator)
            throw new TypeError("Symbol.asyncIterator is not defined.");
        var g = generator.apply(thisArg, _arguments || []), i, q = [];
        return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
        function verb(n) { if (g[n])
            i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
        function resume(n, v) { try {
            step(g[n](v));
        }
        catch (e) {
            settle(q[0][3], e);
        } }
        function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
        function fulfill(value) { resume("next", value); }
        function reject(value) { resume("throw", value); }
        function settle(f, v) { if (f(v), q.shift(), q.length)
            resume(q[0][0], q[0][1]); }
    }
    function __asyncDelegator(o) {
        var i, p;
        return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
        function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
    }
    function __asyncValues(o) {
        if (!Symbol.asyncIterator)
            throw new TypeError("Symbol.asyncIterator is not defined.");
        var m = o[Symbol.asyncIterator], i;
        return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
        function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
        function settle(resolve, reject, d, v) { Promise.resolve(v).then(function (v) { resolve({ value: v, done: d }); }, reject); }
    }
    function __makeTemplateObject(cooked, raw) {
        if (Object.defineProperty) {
            Object.defineProperty(cooked, "raw", { value: raw });
        }
        else {
            cooked.raw = raw;
        }
        return cooked;
    }
    ;
    var __setModuleDefault = Object.create ? (function (o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function (o, v) {
        o["default"] = v;
    };
    function __importStar(mod) {
        if (mod && mod.__esModule)
            return mod;
        var result = {};
        if (mod != null)
            for (var k in mod)
                if (Object.hasOwnProperty.call(mod, k))
                    __createBinding(result, mod, k);
        __setModuleDefault(result, mod);
        return result;
    }
    function __importDefault(mod) {
        return (mod && mod.__esModule) ? mod : { default: mod };
    }
    function __classPrivateFieldGet(receiver, privateMap) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to get private field on non-instance");
        }
        return privateMap.get(receiver);
    }
    function __classPrivateFieldSet(receiver, privateMap, value) {
        if (!privateMap.has(receiver)) {
            throw new TypeError("attempted to set private field on non-instance");
        }
        privateMap.set(receiver, value);
        return value;
    }

    var cssClassNames = {
        loaded: 'ng-lazyloaded',
        loading: 'ng-lazyloading',
        failed: 'ng-failed-lazyloaded',
    };
    function removeCssClassName(element, cssClassName) {
        element.className = element.className.replace(cssClassName, '');
    }
    function addCssClassName(element, cssClassName) {
        if (!element.className.includes(cssClassName)) {
            element.className += " " + cssClassName;
        }
    }
    function hasCssClassName(element, cssClassName) {
        return element.className && element.className.includes(cssClassName);
    }

    var SharedHooks = /** @class */ (function (_super) {
        __extends(SharedHooks, _super);
        function SharedHooks() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        SharedHooks.prototype.setup = function (attributes) {
            setImageAndSourcesToDefault(attributes.element, attributes.defaultImagePath, attributes.useSrcset);
            addCssClassName(attributes.element, cssClassNames.loading);
            if (hasCssClassName(attributes.element, cssClassNames.loaded)) {
                removeCssClassName(attributes.element, cssClassNames.loaded);
            }
        };
        SharedHooks.prototype.finally = function (attributes) {
            addCssClassName(attributes.element, cssClassNames.loaded);
            removeCssClassName(attributes.element, cssClassNames.loading);
        };
        SharedHooks.prototype.loadImage = function (attributes) {
            if (this.skipLazyLoading()) {
                // Set the image right away for bots for better SEO
                return [attributes.imagePath];
            }
            var element = attributes.element, useSrcset = attributes.useSrcset, imagePath = attributes.imagePath, decode = attributes.decode;
            var img;
            if (isImageElement(element) && isChildOfPicture(element)) {
                var parentClone = element.parentNode.cloneNode(true);
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
                return img.decode().then(function () { return imagePath; });
            }
            return new Promise(function (resolve, reject) {
                img.onload = function () { return resolve(imagePath); };
                img.onerror = function () { return reject(null); };
            });
        };
        SharedHooks.prototype.setErrorImage = function (error, attributes) {
            var element = attributes.element, useSrcset = attributes.useSrcset, errorImagePath = attributes.errorImagePath;
            setImageAndSourcesToError(element, errorImagePath, useSrcset);
            addCssClassName(element, cssClassNames.failed);
        };
        SharedHooks.prototype.setLoadedImage = function (imagePath, attributes) {
            var element = attributes.element, useSrcset = attributes.useSrcset;
            setImageAndSourcesToLazy(element, imagePath, useSrcset);
        };
        SharedHooks.prototype.isDisabled = function () {
            // Disable if SSR and the user isn't a bot
            return common.isPlatformServer(this.platformId) && !this.isBot();
        };
        SharedHooks.prototype.skipLazyLoading = function () {
            return this.isBot();
        };
        SharedHooks.prototype.isBot = function () {
            var _a;
            if ((_a = this.navigator) === null || _a === void 0 ? void 0 : _a.userAgent) {
                return /googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|quora\ link\ preview|showyoubot|outbrain|pinterest\/0\.|pinterestbot|slackbot|vkShare|W3C_Validator|whatsapp|duckduckbot/i.test(this.navigator.userAgent);
            }
            return false;
        };
        return SharedHooks;
    }(Hooks));

    var IntersectionObserverHooks = /** @class */ (function (_super) {
        __extends(IntersectionObserverHooks, _super);
        function IntersectionObserverHooks() {
            var _this = _super.apply(this, __spread(arguments)) || this;
            _this.observers = new WeakMap();
            _this.intersectionSubject = new rxjs.Subject();
            _this.uniqKey = {};
            return _this;
        }
        IntersectionObserverHooks.prototype.getObservable = function (attributes) {
            var _this = this;
            if (this.skipLazyLoading()) {
                return rxjs.of({ isIntersecting: true });
            }
            if (attributes.customObservable) {
                return attributes.customObservable;
            }
            var scrollContainerKey = attributes.scrollContainer || this.uniqKey;
            var options = {
                root: attributes.scrollContainer || null,
            };
            if (attributes.offset) {
                options.rootMargin = attributes.offset + "px";
            }
            var observer = this.observers.get(scrollContainerKey);
            if (!observer) {
                observer = new IntersectionObserver(function (entrys) { return _this.loadingCallback(entrys); }, options);
                this.observers.set(scrollContainerKey, observer);
            }
            observer.observe(attributes.element);
            return rxjs.Observable.create(function (obs) {
                var subscription = _this.intersectionSubject.pipe(operators.filter(function (entry) { return entry.target === attributes.element; })).subscribe(obs);
                return function () {
                    subscription.unsubscribe();
                    observer.unobserve(attributes.element);
                };
            });
        };
        IntersectionObserverHooks.prototype.isVisible = function (event) {
            return event.isIntersecting;
        };
        IntersectionObserverHooks.prototype.loadingCallback = function (entrys) {
            var _this = this;
            entrys.forEach(function (entry) { return _this.intersectionSubject.next(entry); });
        };
        return IntersectionObserverHooks;
    }(SharedHooks));

    var LazyLoadImageModule = /** @class */ (function () {
        function LazyLoadImageModule() {
        }
        return LazyLoadImageModule;
    }());
    LazyLoadImageModule.decorators = [
        { type: core.NgModule, args: [{
                    declarations: [LazyLoadImageDirective],
                    exports: [LazyLoadImageDirective],
                    providers: [{ provide: LAZYLOAD_IMAGE_HOOKS, useClass: IntersectionObserverHooks }],
                },] }
    ];

    var Rect = /** @class */ (function () {
        function Rect(left, top, right, bottom) {
            this.left = left;
            this.top = top;
            this.right = right;
            this.bottom = bottom;
        }
        Rect.fromElement = function (element) {
            var _a = element.getBoundingClientRect(), left = _a.left, top = _a.top, right = _a.right, bottom = _a.bottom;
            if (left === 0 && top === 0 && right === 0 && bottom === 0) {
                return Rect.empty;
            }
            else {
                return new Rect(left, top, right, bottom);
            }
        };
        Rect.fromWindow = function (_window) {
            return new Rect(0, 0, _window.innerWidth, _window.innerHeight);
        };
        Rect.prototype.inflate = function (inflateBy) {
            this.left -= inflateBy;
            this.top -= inflateBy;
            this.right += inflateBy;
            this.bottom += inflateBy;
        };
        Rect.prototype.intersectsWith = function (rect) {
            return rect.left < this.right && this.left < rect.right && rect.top < this.bottom && this.top < rect.bottom;
        };
        Rect.prototype.getIntersectionWith = function (rect) {
            var left = Math.max(this.left, rect.left);
            var top = Math.max(this.top, rect.top);
            var right = Math.min(this.right, rect.right);
            var bottom = Math.min(this.bottom, rect.bottom);
            if (right >= left && bottom >= top) {
                return new Rect(left, top, right, bottom);
            }
            else {
                return Rect.empty;
            }
        };
        return Rect;
    }());
    Rect.empty = new Rect(0, 0, 0, 0);

    var ScrollHooks = /** @class */ (function (_super) {
        __extends(ScrollHooks, _super);
        function ScrollHooks(getWindow) {
            if (getWindow === void 0) { getWindow = function () { return window; }; }
            var _this = _super.call(this) || this;
            _this.scrollListeners = new WeakMap();
            // Only create one scroll listener per target and share the observable.
            // Typical, there will only be one observable per application
            _this.getScrollListener = function (scrollTarget) {
                if (!scrollTarget || typeof scrollTarget.addEventListener !== 'function') {
                    console.warn('`addEventListener` on ' + scrollTarget + ' (scrollTarget) is not a function. Skipping this target');
                    return rxjs.empty();
                }
                var scrollListener = _this.scrollListeners.get(scrollTarget);
                if (scrollListener) {
                    return scrollListener;
                }
                var srollEvent = rxjs.Observable.create(function (observer) {
                    var eventName = 'scroll';
                    var handler = function (event) { return observer.next(event); };
                    var options = { passive: true, capture: false };
                    scrollTarget.addEventListener(eventName, handler, options);
                    return function () { return scrollTarget.removeEventListener(eventName, handler, options); };
                });
                var listener = _this.sampleObservable(srollEvent);
                _this.scrollListeners.set(scrollTarget, listener);
                return listener;
            };
            _this.getWindow = getWindow;
            return _this;
        }
        ScrollHooks.prototype.getObservable = function (attributes) {
            if (this.skipLazyLoading()) {
                return rxjs.of('load');
            }
            else if (attributes.customObservable) {
                return attributes.customObservable.pipe(operators.startWith(''));
            }
            else if (attributes.scrollContainer) {
                return this.getScrollListener(attributes.scrollContainer);
            }
            return this.getScrollListener(this.getWindow());
        };
        ScrollHooks.prototype.isVisible = function (event, attributes) {
            var elementBounds = Rect.fromElement(attributes.element);
            if (elementBounds === Rect.empty) {
                return false;
            }
            var windowBounds = Rect.fromWindow(this.getWindow());
            elementBounds.inflate(attributes.offset);
            if (attributes.scrollContainer) {
                var scrollContainerBounds = Rect.fromElement(attributes.scrollContainer);
                var intersection = scrollContainerBounds.getIntersectionWith(windowBounds);
                return elementBounds.intersectsWith(intersection);
            }
            else {
                return elementBounds.intersectsWith(windowBounds);
            }
        };
        ScrollHooks.prototype.sampleObservable = function (obs, scheduler) {
            return obs.pipe(operators.sampleTime(100, scheduler), operators.share(), operators.startWith(''));
        };
        return ScrollHooks;
    }(SharedHooks));

    /**
     * Generated bundle index. Do not edit.
     */

    exports.Hooks = Hooks;
    exports.IntersectionObserverHooks = IntersectionObserverHooks;
    exports.LAZYLOAD_IMAGE_HOOKS = LAZYLOAD_IMAGE_HOOKS;
    exports.LazyLoadImageModule = LazyLoadImageModule;
    exports.ScrollHooks = ScrollHooks;
    exports.SharedHooks = SharedHooks;
    exports.ɵa = LazyLoadImageDirective;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=ng-lazyload-image.umd.js.map
