/******************************************************************************
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
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

var SDKErrorType;
(function (SDKErrorType) {
    SDKErrorType["NETWORK_ERROR"] = "NETWORK_ERROR";
    SDKErrorType["AUTH_ERROR"] = "AUTH_ERROR";
    SDKErrorType["SESSION_EXPIRED"] = "SESSION_EXPIRED";
    SDKErrorType["RATE_LIMITED"] = "RATE_LIMITED";
    SDKErrorType["INVALID_SCORE"] = "INVALID_SCORE";
    SDKErrorType["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    SDKErrorType["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(SDKErrorType || (SDKErrorType = {}));
var SDKError = (function (_super) {
    __extends(SDKError, _super);
    function SDKError(type, message, statusCode, details) {
        var _this = _super.call(this, message) || this;
        _this.name = 'SDKError';
        _this.type = type;
        _this.statusCode = statusCode;
        _this.details = details;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(_this, SDKError);
        }
        return _this;
    }
    return SDKError;
}(Error));

var HttpClient = (function () {
    function HttpClient(baseUrl, apiKey, debug) {
        if (debug === void 0) { debug = false; }
        this.token = null;
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
        this.debug = debug;
    }
    HttpClient.prototype.setToken = function (token) {
        this.token = token;
    };
    HttpClient.prototype.clearToken = function () {
        this.token = null;
    };
    HttpClient.prototype.request = function (endpoint_1, options_1) {
        return __awaiter(this, arguments, void 0, function (endpoint, options, retries) {
            var url, headers, requestInit, lastError, _loop_1, this_1, attempt, state_1;
            if (retries === void 0) { retries = 3; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = "".concat(this.baseUrl).concat(endpoint);
                        headers = __assign({ 'Content-Type': 'application/json', 'X-API-Key': this.apiKey }, options.headers);
                        if (this.token) {
                            headers['Authorization'] = "Bearer ".concat(this.token);
                        }
                        requestInit = {
                            method: options.method,
                            headers: headers,
                            body: options.body ? JSON.stringify(options.body) : undefined
                        };
                        if (this.debug) {
                            console.log("[Lyvely SDK] ".concat(options.method, " ").concat(url), options.body);
                        }
                        lastError = null;
                        _loop_1 = function (attempt) {
                            var controller_1, timeout, timeoutId, response, errorData, errorType, data, error_1, delay;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _b.trys.push([0, 5, , 7]);
                                        controller_1 = new AbortController();
                                        timeout = options.timeout || 30000;
                                        timeoutId = setTimeout(function () { return controller_1.abort(); }, timeout);
                                        return [4, fetch(url, __assign(__assign({}, requestInit), { signal: controller_1.signal }))];
                                    case 1:
                                        response = _b.sent();
                                        clearTimeout(timeoutId);
                                        if (!!response.ok) return [3, 3];
                                        return [4, response.json().catch(function () { return ({}); })];
                                    case 2:
                                        errorData = _b.sent();
                                        if (this_1.debug) {
                                            console.error("[Lyvely SDK] Error ".concat(response.status, ":"), errorData);
                                        }
                                        errorType = void 0;
                                        switch (response.status) {
                                            case 401:
                                            case 403:
                                                errorType = SDKErrorType.AUTH_ERROR;
                                                break;
                                            case 404:
                                                errorType = SDKErrorType.SESSION_EXPIRED;
                                                break;
                                            case 429:
                                                errorType = SDKErrorType.RATE_LIMITED;
                                                break;
                                            case 400:
                                                errorType = SDKErrorType.VALIDATION_ERROR;
                                                break;
                                            default:
                                                errorType = SDKErrorType.NETWORK_ERROR;
                                        }
                                        throw new SDKError(errorType, errorData.message || "HTTP ".concat(response.status, ": ").concat(response.statusText), response.status, errorData);
                                    case 3: return [4, response.json()];
                                    case 4:
                                        data = _b.sent();
                                        if (this_1.debug) {
                                            console.log("[Lyvely SDK] Response:", data);
                                        }
                                        return [2, { value: data }];
                                    case 5:
                                        error_1 = _b.sent();
                                        lastError = error_1;
                                        if (error_1 instanceof SDKError &&
                                            (error_1.type === SDKErrorType.AUTH_ERROR ||
                                                error_1.type === SDKErrorType.VALIDATION_ERROR ||
                                                error_1.type === SDKErrorType.SESSION_EXPIRED)) {
                                            throw error_1;
                                        }
                                        if (attempt >= retries) {
                                            return [2, "break"];
                                        }
                                        delay = Math.pow(2, attempt) * 1000;
                                        if (this_1.debug) {
                                            console.warn("[Lyvely SDK] Retrying in ".concat(delay, "ms (attempt ").concat(attempt + 1, "/").concat(retries, ")"));
                                        }
                                        return [4, this_1.sleep(delay)];
                                    case 6:
                                        _b.sent();
                                        return [3, 7];
                                    case 7: return [2];
                                }
                            });
                        };
                        this_1 = this;
                        attempt = 0;
                        _a.label = 1;
                    case 1:
                        if (!(attempt <= retries)) return [3, 4];
                        return [5, _loop_1(attempt)];
                    case 2:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2, state_1.value];
                        if (state_1 === "break")
                            return [3, 4];
                        _a.label = 3;
                    case 3:
                        attempt++;
                        return [3, 1];
                    case 4:
                        if (lastError instanceof SDKError) {
                            throw lastError;
                        }
                        throw new SDKError(SDKErrorType.NETWORK_ERROR, (lastError === null || lastError === void 0 ? void 0 : lastError.message) || 'Network request failed', undefined, lastError);
                }
            });
        });
    };
    HttpClient.prototype.get = function (endpoint, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.request(endpoint, __assign({ method: 'GET' }, options))];
            });
        });
    };
    HttpClient.prototype.post = function (endpoint, body, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.request(endpoint, __assign({ method: 'POST', body: body }, options))];
            });
        });
    };
    HttpClient.prototype.put = function (endpoint, body, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.request(endpoint, __assign({ method: 'PUT', body: body }, options))];
            });
        });
    };
    HttpClient.prototype.sleep = function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
    return HttpClient;
}());

var EventEmitter = (function () {
    function EventEmitter() {
        this.listeners = new Map();
    }
    EventEmitter.prototype.on = function (event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    };
    EventEmitter.prototype.off = function (event, callback) {
        var callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.delete(callback);
        }
    };
    EventEmitter.prototype.emit = function (event, data) {
        var callbacks = this.listeners.get(event);
        if (callbacks) {
            callbacks.forEach(function (callback) {
                try {
                    callback(data);
                }
                catch (error) {
                    console.error("[Lyvely SDK] Error in ".concat(event, " event handler:"), error);
                }
            });
        }
    };
    EventEmitter.prototype.removeAllListeners = function (event) {
        if (event) {
            this.listeners.delete(event);
        }
        else {
            this.listeners.clear();
        }
    };
    return EventEmitter;
}());

var SessionManager = (function () {
    function SessionManager(httpClient, eventEmitter, heartbeatInterval, debug) {
        var _this = this;
        this.session = null;
        this.heartbeatTimer = null;
        this.httpClient = httpClient;
        this.eventEmitter = eventEmitter;
        this.heartbeatInterval = heartbeatInterval;
        this.debug = debug;
        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', function () {
                if (document.hidden) {
                    _this.pauseHeartbeat();
                }
                else {
                    _this.resumeHeartbeat();
                }
            });
        }
    }
    SessionManager.prototype.startSession = function (userId, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_1, sdkError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        if (!this.session) return [3, 2];
                        if (this.debug) {
                            console.warn('[Lyvely SDK] Session already active, ending previous session');
                        }
                        return [4, this.endSession()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4, this.httpClient.post('/api/v1/sessions', {
                            userId: userId,
                            metadata: __assign(__assign({}, metadata), { userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined, timestamp: new Date().toISOString() })
                        })];
                    case 3:
                        response = _a.sent();
                        this.session = response;
                        this.httpClient.setToken(response.token);
                        this.startHeartbeat();
                        this.eventEmitter.emit('sessionStart', {
                            sessionId: response.sessionId,
                            userId: response.userId
                        });
                        if (this.debug) {
                            console.log('[Lyvely SDK] Session started:', response.sessionId);
                        }
                        return [2, response];
                    case 4:
                        error_1 = _a.sent();
                        if (error_1 instanceof SDKError) {
                            this.eventEmitter.emit('error', error_1);
                            throw error_1;
                        }
                        sdkError = new SDKError(SDKErrorType.UNKNOWN_ERROR, 'Failed to start session', undefined, error_1);
                        this.eventEmitter.emit('error', sdkError);
                        throw sdkError;
                    case 5: return [2];
                }
            });
        });
    };
    SessionManager.prototype.endSession = function (finalScore, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2, sdkError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.session) {
                            if (this.debug) {
                                console.warn('[Lyvely SDK] No active session to end');
                            }
                            return [2, null];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        this.stopHeartbeat();
                        return [4, this.httpClient.post("/api/v1/sessions/".concat(this.session.sessionId, "/end"), __assign({ finalScore: finalScore, completed: true }, metadata))];
                    case 2:
                        response = _a.sent();
                        this.eventEmitter.emit('sessionEnd', response);
                        if (this.debug) {
                            console.log('[Lyvely SDK] Session ended:', this.session.sessionId);
                        }
                        this.cleanup();
                        return [2, response];
                    case 3:
                        error_2 = _a.sent();
                        this.cleanup();
                        if (error_2 instanceof SDKError) {
                            this.eventEmitter.emit('error', error_2);
                            throw error_2;
                        }
                        sdkError = new SDKError(SDKErrorType.UNKNOWN_ERROR, 'Failed to end session', undefined, error_2);
                        this.eventEmitter.emit('error', sdkError);
                        throw sdkError;
                    case 4: return [2];
                }
            });
        });
    };
    SessionManager.prototype.getSession = function () {
        return this.session;
    };
    SessionManager.prototype.hasActiveSession = function () {
        return this.session !== null;
    };
    SessionManager.prototype.startHeartbeat = function () {
        var _this = this;
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
        this.heartbeatTimer = window.setInterval(function () {
            _this.sendHeartbeat();
        }, this.heartbeatInterval);
        if (this.debug) {
            console.log("[Lyvely SDK] Heartbeat started (".concat(this.heartbeatInterval, "ms interval)"));
        }
    };
    SessionManager.prototype.stopHeartbeat = function () {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
            if (this.debug) {
                console.log('[Lyvely SDK] Heartbeat stopped');
            }
        }
    };
    SessionManager.prototype.pauseHeartbeat = function () {
        if (this.heartbeatTimer && this.debug) {
            console.log('[Lyvely SDK] Heartbeat paused (tab hidden)');
        }
    };
    SessionManager.prototype.resumeHeartbeat = function () {
        if (this.session && this.debug) {
            console.log('[Lyvely SDK] Heartbeat resumed (tab visible)');
            this.sendHeartbeat();
        }
    };
    SessionManager.prototype.sendHeartbeat = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.session) {
                            this.stopHeartbeat();
                            return [2];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4, this.httpClient.post("/api/v1/sessions/".concat(this.session.sessionId, "/heartbeat"), {
                                timestamp: new Date().toISOString()
                            })];
                    case 2:
                        _a.sent();
                        this.eventEmitter.emit('heartbeat', {
                            sessionId: this.session.sessionId
                        });
                        if (this.debug) {
                            console.log('[Lyvely SDK] Heartbeat sent');
                        }
                        return [3, 4];
                    case 3:
                        error_3 = _a.sent();
                        if (error_3 instanceof SDKError && error_3.type === SDKErrorType.SESSION_EXPIRED) {
                            if (this.debug) {
                                console.error('[Lyvely SDK] Session expired');
                            }
                            this.stopHeartbeat();
                            this.eventEmitter.emit('sessionExpired', {
                                sessionId: this.session.sessionId
                            });
                            this.cleanup();
                        }
                        else {
                            if (this.debug) {
                                console.error('[Lyvely SDK] Heartbeat failed:', error_3);
                            }
                        }
                        return [3, 4];
                    case 4: return [2];
                }
            });
        });
    };
    SessionManager.prototype.cleanup = function () {
        this.session = null;
        this.httpClient.clearToken();
    };
    SessionManager.prototype.destroy = function () {
        this.stopHeartbeat();
        this.cleanup();
    };
    return SessionManager;
}());

var LyvelySDK = (function () {
    function LyvelySDK(config) {
        this.isInitialized = false;
        this.initPromise = null;
        this.config = {
            gameId: config.gameId,
            apiKey: config.apiKey,
            apiBaseUrl: config.apiBaseUrl || 'https://api.lyvely.com',
            environment: config.environment || 'production',
            debug: config.debug || false,
            heartbeatInterval: config.heartbeatInterval || 60000,
            sessionTimeout: config.sessionTimeout || 300000
        };
        if (!this.config.gameId) {
            throw new Error('Lyvely SDK: gameId is required');
        }
        if (!this.config.apiKey) {
            throw new Error('Lyvely SDK: apiKey is required');
        }
        if (!this.config.apiKey.startsWith('pk_')) {
            console.warn('Lyvely SDK: apiKey should be a publishable key (pk_live_* or pk_test_*)');
        }
        this.eventEmitter = new EventEmitter();
        this.httpClient = new HttpClient(this.config.apiBaseUrl, this.config.apiKey, this.config.debug);
        this.sessionManager = new SessionManager(this.httpClient, this.eventEmitter, this.config.heartbeatInterval, this.config.debug);
        if (this.config.debug) {
            console.log('[Lyvely SDK] Initialized with config:', {
                gameId: this.config.gameId,
                environment: this.config.environment,
                apiBaseUrl: this.config.apiBaseUrl
            });
        }
    }
    LyvelySDK.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.isInitialized) {
                    return [2];
                }
                if (this.initPromise) {
                    return [2, this.initPromise];
                }
                this.initPromise = this._init();
                return [2, this.initPromise];
            });
        });
    };
    LyvelySDK.prototype._init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1, sdkError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4, this.httpClient.get("/api/v1/games/".concat(this.config.gameId))];
                    case 1:
                        _a.sent();
                        this.isInitialized = true;
                        this.eventEmitter.emit('ready');
                        if (this.config.debug) {
                            console.log('[Lyvely SDK] Ready');
                        }
                        return [3, 3];
                    case 2:
                        error_1 = _a.sent();
                        sdkError = error_1 instanceof SDKError
                            ? error_1
                            : new SDKError(SDKErrorType.UNKNOWN_ERROR, 'Failed to initialize SDK', undefined, error_1);
                        this.eventEmitter.emit('error', sdkError);
                        throw sdkError;
                    case 3: return [2];
                }
            });
        });
    };
    LyvelySDK.prototype.ready = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.init()];
            });
        });
    };
    LyvelySDK.prototype.startSession = function (userId, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var effectiveUserId;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        effectiveUserId = userId || this.getOrCreateAnonymousUserId();
                        return [2, this.sessionManager.startSession(effectiveUserId, __assign(__assign({}, metadata), { gameId: this.config.gameId }))];
                }
            });
        });
    };
    LyvelySDK.prototype.submitScore = function (score, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var session, response, error_2, sdkError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        session = this.sessionManager.getSession();
                        if (!session) {
                            throw new SDKError(SDKErrorType.VALIDATION_ERROR, 'No active session. Call startSession() first.');
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4, this.httpClient.post("/api/v1/sessions/".concat(session.sessionId, "/score"), {
                                score: score,
                                metadata: __assign(__assign({}, metadata), { timestamp: new Date().toISOString() })
                            })];
                    case 3:
                        response = _a.sent();
                        this.eventEmitter.emit('scoreSubmitted', {
                            score: score,
                            rank: response.rank,
                            isNewHighScore: response.isNewHighScore
                        });
                        if (this.config.debug) {
                            console.log('[Lyvely SDK] Score submitted:', score, 'Rank:', response.rank);
                        }
                        return [2, response];
                    case 4:
                        error_2 = _a.sent();
                        if (error_2 instanceof SDKError) {
                            this.eventEmitter.emit('error', error_2);
                            throw error_2;
                        }
                        sdkError = new SDKError(SDKErrorType.UNKNOWN_ERROR, 'Failed to submit score', undefined, error_2);
                        this.eventEmitter.emit('error', sdkError);
                        throw sdkError;
                    case 5: return [2];
                }
            });
        });
    };
    LyvelySDK.prototype.endSession = function (finalScore, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2, this.sessionManager.endSession(finalScore, metadata)];
                }
            });
        });
    };
    LyvelySDK.prototype.getLeaderboard = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var params, queryString, endpoint, response, error_3, sdkError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        params = new URLSearchParams();
                        if (options === null || options === void 0 ? void 0 : options.period)
                            params.append('period', options.period);
                        if (options === null || options === void 0 ? void 0 : options.limit)
                            params.append('limit', options.limit.toString());
                        if (options === null || options === void 0 ? void 0 : options.offset)
                            params.append('offset', options.offset.toString());
                        queryString = params.toString();
                        endpoint = "/api/v1/leaderboards/".concat(this.config.gameId).concat(queryString ? '?' + queryString : '');
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4, this.httpClient.get(endpoint)];
                    case 3:
                        response = _a.sent();
                        if (this.config.debug) {
                            console.log('[Lyvely SDK] Leaderboard fetched:', response.entries.length, 'entries');
                        }
                        return [2, response];
                    case 4:
                        error_3 = _a.sent();
                        if (error_3 instanceof SDKError) {
                            this.eventEmitter.emit('error', error_3);
                            throw error_3;
                        }
                        sdkError = new SDKError(SDKErrorType.UNKNOWN_ERROR, 'Failed to fetch leaderboard', undefined, error_3);
                        this.eventEmitter.emit('error', sdkError);
                        throw sdkError;
                    case 5: return [2];
                }
            });
        });
    };
    LyvelySDK.prototype.getSession = function () {
        return this.sessionManager.getSession();
    };
    LyvelySDK.prototype.hasActiveSession = function () {
        return this.sessionManager.hasActiveSession();
    };
    LyvelySDK.prototype.on = function (event, callback) {
        this.eventEmitter.on(event, callback);
    };
    LyvelySDK.prototype.off = function (event, callback) {
        this.eventEmitter.off(event, callback);
    };
    LyvelySDK.prototype.getVersion = function () {
        return '0.1.0';
    };
    LyvelySDK.prototype.getConfig = function () {
        return {
            gameId: this.config.gameId,
            apiBaseUrl: this.config.apiBaseUrl,
            environment: this.config.environment,
            debug: this.config.debug
        };
    };
    LyvelySDK.prototype.destroy = function () {
        this.sessionManager.destroy();
        this.eventEmitter.removeAllListeners();
        this.isInitialized = false;
        this.initPromise = null;
        if (this.config.debug) {
            console.log('[Lyvely SDK] Destroyed');
        }
    };
    LyvelySDK.prototype.ensureInitialized = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.isInitialized) return [3, 2];
                        return [4, this.init()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2];
                }
            });
        });
    };
    LyvelySDK.prototype.getOrCreateAnonymousUserId = function () {
        var storageKey = "lyvely_user_".concat(this.config.gameId);
        if (typeof localStorage !== 'undefined') {
            var userId = localStorage.getItem(storageKey);
            if (!userId) {
                userId = "anon_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 11));
                localStorage.setItem(storageKey, userId);
            }
            return userId;
        }
        return "anon_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 11));
    };
    return LyvelySDK;
}());

export { LyvelySDK, SDKError, SDKErrorType, LyvelySDK as default };
//# sourceMappingURL=lyvely-game-sdk.esm.js.map
