import { n as e, r as t, t as n } from "./jsx-runtime-Bz8zB3tG.js";
import { a as r, c as i, i as a, l as o, n as s, r as c, s as ee, t as l } from "./editor.api-CBhnZFl3.js";
import { t as u } from "./toggleHighContrast-wJCBnj4M.js";
import { a as d, i as f, n as p, r as m, t as h } from "./register-CoIKknfv.js";
//#region node_modules/monaco-editor/esm/external/monaco-lsp-client/out/index.js
var g = t(), _ = e(), v = Object.defineProperty, te = (e, t, n) => t in e ? v(e, t, {
	enumerable: !0,
	configurable: !0,
	writable: !0,
	value: n
}) : e[t] = n, y = (e, t, n) => te(e, typeof t == "symbol" ? t : t + "", n), b, x, S, ne, C;
function re(e) {
	return e.method !== void 0;
}
var ie;
(function(e) {
	function t(e) {
		return e;
	}
	e.create = t;
})(ie ||= {});
var w;
(function(e) {
	e.parseError = -32700, e.invalidRequest = -32600, e.methodNotFound = -32601, e.invalidParams = -32602, e.internalError = -32603;
	function t(e) {
		return -32099 <= e && e <= -32e3;
	}
	e.isServerError = t;
	function n(e) {
		if (!t(e)) throw Error("Invalid range for a server error.");
		return e;
	}
	e.serverError = n, e.unexpectedServerError = -32e3;
	function r(e) {
		return !0;
	}
	e.isApplicationError = r;
	function i(e) {
		return e;
	}
	e.applicationError = i, e.genericApplicationError = -320100;
})(w ||= {});
var ae = class {
	constructor() {
		y(this, "listeners", /* @__PURE__ */ new Set()), y(this, "event", (e) => (this.listeners.add(e), { dispose: () => {
			this.listeners.delete(e);
		} }));
	}
	fire(e) {
		this.listeners.forEach((t) => t(e));
	}
}, oe = class {
	constructor(e) {
		y(this, "_value"), y(this, "eventEmitter"), this._value = e, this.eventEmitter = new ae();
	}
	get value() {
		return this._value;
	}
	set value(e) {
		this._value !== e && (this._value = e, this.eventEmitter.fire(e));
	}
	get onChange() {
		return this.eventEmitter.event;
	}
};
function se(e, t) {
	let n = setTimeout(t, e);
	return { dispose: () => clearTimeout(n) };
}
function T(e, t, n) {
	return e instanceof Set ? (e.add(t), { dispose: () => e.delete(t) }) : (e.set(t, n), { dispose: () => e.delete(t) });
}
var ce = class {
	constructor() {
		y(this, "_state", "none"), y(this, "promise"), y(this, "resolve", () => {}), y(this, "reject", () => {}), this.promise = new Promise((e, t) => {
			this.resolve = e, this.reject = t;
		});
	}
	get state() {
		return this._state;
	}
};
b = class {
	constructor() {
		y(this, "_unprocessedMessages", []), y(this, "_messageListener"), y(this, "id", b.id++), y(this, "_state", new oe({ state: "open" })), y(this, "state", this._state);
	}
	setListener(e) {
		if (this._messageListener = e, e) for (; this._unprocessedMessages.length > 0 && this._messageListener !== void 0;) {
			let e = this._unprocessedMessages.shift();
			this._messageListener(e);
		}
	}
	send(e) {
		return this._sendImpl(e);
	}
	_dispatchReceivedMessage(e) {
		this._unprocessedMessages.length === 0 && this._messageListener ? this._messageListener(e) : this._unprocessedMessages.push(e);
	}
	_onConnectionClosed() {
		this._state.value = {
			state: "closed",
			error: void 0
		};
	}
	log(e) {
		return new le(this, e ?? new ue());
	}
}, y(b, "id", 0);
var le = class {
	constructor(e, t) {
		y(this, "baseStream"), y(this, "logger"), this.baseStream = e, this.logger = t;
	}
	get state() {
		return this.baseStream.state;
	}
	setListener(e) {
		if (e === void 0) {
			this.baseStream.setListener(void 0);
			return;
		}
		this.baseStream.setListener((t) => {
			this.logger.log(this.baseStream, "incoming", t), e(t);
		});
	}
	send(e) {
		return this.logger.log(this.baseStream, "outgoing", e), this.baseStream.send(e);
	}
	toString() {
		return `StreamLogger/${this.baseStream.toString()}`;
	}
}, ue = class {
	log(e, t, n) {
		console.log(`${t === "incoming" ? "<-" : "->"} [${e.toString()}] ${JSON.stringify(n)}`);
	}
}, de = class e {
	constructor(e) {
		y(this, "connect"), this.connect = e;
	}
	mapContext(t) {
		return new e((e) => this.connect(e ? fe(e, t) : void 0));
	}
};
function fe(e, t) {
	return {
		handleNotification: (n, r) => e.handleNotification(n, t(r)),
		handleRequest: (n, r, i) => e.handleRequest(n, r, t(i))
	};
}
var pe = class e {
	constructor(e, t, n) {
		y(this, "_stream"), y(this, "_listener"), y(this, "_logger"), y(this, "_unprocessedResponses", /* @__PURE__ */ new Map()), y(this, "_lastUsedRequestId", 0), this._stream = e, this._listener = t, this._logger = n, this._stream.setListener((e) => {
			re(e) ? e.id === void 0 ? this._processNotification(e) : this._processRequest(e) : this._processResponse(e);
		});
	}
	static createChannel(t, n) {
		let r = !1;
		return new de((i) => {
			if (r) throw Error(`A channel to the stream ${t} was already constructed!`);
			return r = !0, new e(t, i, n);
		});
	}
	get state() {
		return this._stream.state;
	}
	async _processNotification(e) {
		if (e.id !== void 0) throw Error();
		if (!this._listener) {
			this._logger && this._logger.debug({
				text: "Notification ignored",
				message: e
			});
			return;
		}
		try {
			await this._listener.handleNotification({
				method: e.method,
				params: e.params || null
			});
		} catch (t) {
			this._logger && this._logger.warn({
				text: `Exception was thrown while handling notification: ${t}`,
				exception: t,
				message: e
			});
		}
	}
	async _processRequest(e) {
		if (e.id === void 0) throw Error();
		let t;
		if (this._listener) try {
			t = await this._listener.handleRequest({
				method: e.method,
				params: e.params || null
			}, e.id);
		} catch (n) {
			this._logger && this._logger.warn({
				text: `Exception was thrown while handling request: ${n}`,
				message: e,
				exception: n
			}), t = { error: {
				code: w.internalError,
				message: "An unexpected exception was thrown.",
				data: void 0
			} };
		}
		else this._logger && this._logger.debug({
			text: "Received request even though not listening for requests",
			message: e
		}), t = { error: {
			code: w.methodNotFound,
			message: "This endpoint does not listen for requests or notifications.",
			data: void 0
		} };
		let n;
		n = "result" in t ? {
			jsonrpc: "2.0",
			id: e.id,
			result: t.result
		} : {
			jsonrpc: "2.0",
			id: e.id,
			error: t.error
		}, await this._stream.send(n);
	}
	_processResponse(e) {
		let t = "" + e.id, n = this._unprocessedResponses.get(t);
		if (!n) {
			this._logger && this._logger.debug({
				text: "Got an unexpected response message",
				message: e
			});
			return;
		}
		this._unprocessedResponses.delete(t), n(e);
	}
	_newRequestId() {
		return this._lastUsedRequestId++;
	}
	sendRequest(e, t, n) {
		let r = {
			jsonrpc: "2.0",
			id: this._newRequestId(),
			method: e.method,
			params: e.params || void 0
		};
		return n && n(r.id), new Promise((e, t) => {
			let n = "" + r.id;
			this._unprocessedResponses.set(n, (n) => {
				"result" in n ? e({ result: n.result }) : (n.error || t(/* @__PURE__ */ Error("Response had neither 'result' nor 'error' field set.")), e({ error: n.error }));
			}), this._stream.send(r).then(void 0, (e) => {
				this._unprocessedResponses.delete(n), t(e);
			});
		});
	}
	sendNotification(e, t) {
		let n = {
			jsonrpc: "2.0",
			id: void 0,
			method: e.method,
			params: e.params || void 0
		};
		return this._stream.send(n);
	}
	toString() {
		return "StreamChannel/" + this._stream.toString();
	}
}, E;
(function(e) {
	function t() {
		return {
			deserializeFromJson: (e) => ({
				hasErrors: !1,
				value: e
			}),
			serializeToJson: (e) => e
		};
	}
	e.sAny = t;
	function n() {
		return {
			deserializeFromJson: (e) => ({
				hasErrors: !1,
				value: {}
			}),
			serializeToJson: (e) => ({})
		};
	}
	e.sEmptyObject = n;
	function r() {
		return {
			deserializeFromJson: (e) => ({
				hasErrors: !1,
				value: void 0
			}),
			serializeToJson: (e) => null
		};
	}
	e.sVoidFromNull = r;
})(E ||= {});
var me = Symbol("OptionalMethodNotFound"), he = class {
	contextualize(e) {
		return new ge(this, e);
	}
}, ge = class extends he {
	constructor(e, t) {
		super(), y(this, "underylingTypedChannel"), y(this, "converters"), this.underylingTypedChannel = e, this.converters = t;
	}
	async request(e, t, n) {
		let r = await this.converters.getSendContext(n);
		return this.underylingTypedChannel.request(e, t, r);
	}
	async notify(e, t, n) {
		let r = await this.converters.getSendContext(n);
		return this.underylingTypedChannel.notify(e, t, r);
	}
	registerNotificationHandler(e, t) {
		return this.underylingTypedChannel.registerNotificationHandler(e, async (e, n) => await t(e, await this.converters.getNewContext(n)));
	}
	registerRequestHandler(e, t) {
		return this.underylingTypedChannel.registerRequestHandler(e, async (e, n, r) => await t(e, n, await this.converters.getNewContext(r)));
	}
}, _e = class e extends he {
	constructor(e, t = {}) {
		super(), y(this, "channelCtor"), y(this, "_requestSender"), y(this, "_handler", /* @__PURE__ */ new Map()), y(this, "_unknownNotificationHandler", /* @__PURE__ */ new Set()), y(this, "_timeout"), y(this, "sendExceptionDetails", !1), y(this, "_logger"), y(this, "listeningDeferred", new ce()), y(this, "onListening", this.listeningDeferred.promise), y(this, "_requestDidErrorEventEmitter", new ae()), y(this, "onRequestDidError", this._requestDidErrorEventEmitter.event), this.channelCtor = e, this._logger = t.logger, this.sendExceptionDetails = !!t.sendExceptionDetails, this._timeout = se(1e3, () => {
			this._requestSender || console.warn(`"${this.startListen.name}" has not been called within 1 second after construction of this channel. Did you forget to call it?`, this);
		});
	}
	static fromTransport(t, n = {}) {
		return new e(pe.createChannel(t, n.logger), n);
	}
	startListen() {
		if (this._requestSender) throw Error(`"${this.startListen.name}" can be called only once, but it already has been called.`);
		this._timeout &&= (this._timeout.dispose(), void 0), this._requestSender = this.channelCtor.connect({
			handleRequest: (e, t, n) => this.handleRequest(e, t, n),
			handleNotification: (e, t) => this.handleNotification(e, t)
		}), this.listeningDeferred.resolve();
	}
	checkChannel(e) {
		if (!e) throw Error(`"${this.startListen.name}" must be called before any messages can be sent or received.`);
		return !0;
	}
	async handleRequest(e, t, n) {
		let r = this._handler.get(e.method);
		if (!r) return this._logger && this._logger.debug({
			text: `No request handler for "${e.method}".`,
			data: { requestObject: e }
		}), { error: {
			code: w.methodNotFound,
			message: `No request handler for "${e.method}".`,
			data: { method: e.method }
		} };
		if (r.kind != "request") {
			let t = `"${e.method}" is registered as notification, but was sent as request.`;
			return this._logger && this._logger.debug({
				text: t,
				data: { requestObject: e }
			}), { error: {
				code: w.invalidRequest,
				message: t,
				data: { method: e.method }
			} };
		}
		let i = r.requestType.paramsSerializer.deserializeFromJson(e.params);
		if (i.hasErrors) {
			let t = `Got invalid params: ${i.errorMessage}`;
			return this._logger && this._logger.debug({
				text: t,
				data: {
					requestObject: e,
					errorMessage: i.errorMessage
				}
			}), { error: {
				code: w.invalidParams,
				message: t,
				data: { errors: i.errorMessage }
			} };
		}
		{
			let a = i.value, o;
			try {
				let e = await r.handler(a, t, n);
				if ("error" in e || "errorMessage" in e) {
					let t = e.error ? r.requestType.errorSerializer.serializeToJson(e.error) : void 0;
					o = { error: {
						code: e.errorCode || w.genericApplicationError,
						message: e.errorMessage || "An error was returned",
						data: t
					} };
				} else o = { result: r.requestType.resultSerializer.serializeToJson(e.ok) };
			} catch (t) {
				t instanceof O ? o = { error: {
					code: t.code,
					message: t.message
				} } : (this._logger && this._logger.warn({
					text: `An exception was thrown while handling a request: ${t}.`,
					exception: t,
					data: { requestObject: e }
				}), o = { error: {
					code: w.unexpectedServerError,
					message: this.sendExceptionDetails ? `An exception was thrown while handling a request: ${t}.` : "Server has thrown an unexpected exception"
				} });
			}
			return o;
		}
	}
	async handleNotification(e, t) {
		let n = this._handler.get(e.method);
		if (!n) {
			for (let t of this._unknownNotificationHandler) t(e);
			this._unknownNotificationHandler.size === 0 && this._logger && this._logger.debug({
				text: `Unhandled notification "${e.method}"`,
				data: { requestObject: e }
			});
			return;
		}
		if (n.kind != "notification") {
			this._logger && this._logger.debug({
				text: `"${e.method}" is registered as request, but was sent as notification.`,
				data: { requestObject: e }
			});
			return;
		}
		let r = n.notificationType.paramsSerializer.deserializeFromJson(e.params);
		if (r.hasErrors) {
			this._logger && this._logger.debug({
				text: `Got invalid params: ${r}`,
				data: {
					requestObject: e,
					errorMessage: r.errorMessage
				}
			});
			return;
		}
		let i = r.value;
		for (let r of n.handlers) try {
			r(i, t);
		} catch (t) {
			this._logger && this._logger.warn({
				text: `An exception was thrown while handling a notification: ${t}.`,
				exception: t,
				data: { requestObject: e }
			});
		}
	}
	registerUnknownNotificationHandler(e) {
		return T(this._unknownNotificationHandler, e);
	}
	registerRequestHandler(e, t) {
		if (this._handler.get(e.method)) throw Error(`Handler with method "${e.method}" already registered.`);
		return T(this._handler, e.method, {
			kind: "request",
			requestType: e,
			handler: t
		});
	}
	registerNotificationHandler(e, t) {
		let n = this._handler.get(e.method);
		if (!n) n = {
			kind: "notification",
			notificationType: e,
			handlers: /* @__PURE__ */ new Set()
		}, this._handler.set(e.method, n);
		else {
			if (n.kind !== "notification") throw Error(`Method "${e.method}" was already registered as request handler.`);
			if (n.notificationType !== e) throw Error(`Method "${e.method}" was registered for a different type.`);
		}
		return T(n.handlers, t);
	}
	getRegisteredTypes() {
		let e = [];
		for (let t of this._handler.values()) t.kind === "notification" ? e.push(t.notificationType) : t.kind === "request" && e.push(t.requestType);
		return e;
	}
	async request(e, t, n) {
		if (!this.checkChannel(this._requestSender)) throw Error("Impossible");
		let r = e.paramsSerializer.serializeToJson(t);
		D(r);
		let i = await this._requestSender.sendRequest({
			method: e.method,
			params: r
		}, n);
		if ("error" in i) {
			if (e.isOptional && i.error.code === w.methodNotFound) return me;
			let t;
			if (i.error.data !== void 0) {
				let n = e.errorSerializer.deserializeFromJson(i.error.data);
				if (n.hasErrors) throw Error(n.errorMessage);
				t = n.value;
			} else t = void 0;
			let n = new O(i.error.message, t, i.error.code);
			throw this._requestDidErrorEventEmitter.fire({ error: n }), n;
		}
		{
			let t = e.resultSerializer.deserializeFromJson(i.result);
			if (t.hasErrors) throw Error("Could not deserialize response: " + t.errorMessage + `

${JSON.stringify(i, null, 2)}`);
			return t.value;
		}
	}
	async notify(e, t, n) {
		if (!this.checkChannel(this._requestSender)) throw Error();
		let r = e.paramsSerializer.serializeToJson(t);
		D(r), this._requestSender.sendNotification({
			method: e.method,
			params: r
		}, n);
	}
};
function D(e) {
	if (e !== null && Array.isArray(e) && typeof e != "object") throw Error("Invalid value! Only null, array and object is allowed.");
}
var O = class e extends Error {
	constructor(t, n, r = w.genericApplicationError) {
		super(t), y(this, "data"), y(this, "code"), this.data = n, this.code = r, Object.setPrototypeOf(this, e.prototype);
	}
}, ve = class e {
	constructor(e, t, n, r, i = !1) {
		y(this, "method"), y(this, "paramsSerializer"), y(this, "resultSerializer"), y(this, "errorSerializer"), y(this, "isOptional"), y(this, "kind", "request"), this.method = e, this.paramsSerializer = t, this.resultSerializer = n, this.errorSerializer = r, this.isOptional = i;
	}
	withMethod(t) {
		return new e(t, this.paramsSerializer, this.resultSerializer, this.errorSerializer);
	}
	optional() {
		return new e(this.method, this.paramsSerializer, this.resultSerializer, this.errorSerializer, !0);
	}
}, ye = class e {
	constructor(e, t) {
		y(this, "method"), y(this, "paramsSerializer"), y(this, "kind", "notification"), this.method = e, this.paramsSerializer = t;
	}
	withMethod(t) {
		return new e(t, this.paramsSerializer);
	}
};
function k(e) {
	return new ve((e || {}).method, E.sAny(), E.sAny(), E.sAny());
}
function A(e) {
	return new ye((e || {}).method, E.sAny());
}
var be = (x = Symbol(), S = class {
	constructor(e) {
		y(this, "error"), y(this, x), this.error = e;
	}
}, y(S, "factory", (e) => new S(e)), S);
function xe(e) {
	let t = Se(e.server), n = Se(e.client);
	return new Ce(e.tags || [], t, n);
}
function Se(e) {
	let t = {};
	for (let [n, r] of Object.entries(e)) {
		let e = r.method ? r.method : n;
		t[n] = r.withMethod(e);
	}
	return t;
}
var Ce = class e {
	constructor(e = [], t, n) {
		y(this, "tags"), y(this, "server"), y(this, "client"), this.tags = e, this.server = t, this.client = n;
	}
	_onlyDesignTime() {
		return /* @__PURE__ */ Error("This property is not meant to be accessed at runtime");
	}
	get TContractObject() {
		throw this._onlyDesignTime();
	}
	get TClientInterface() {
		throw this._onlyDesignTime();
	}
	get TServerInterface() {
		throw this._onlyDesignTime();
	}
	get TClientHandler() {
		throw this._onlyDesignTime();
	}
	get TServerHandler() {
		throw this._onlyDesignTime();
	}
	get TTags() {
		throw this._onlyDesignTime();
	}
	getInterface(e, t, n, r) {
		let i = this.buildCounterpart(e, n), a = this.registerHandlers(e, t, r, i);
		return {
			counterpart: i,
			dispose: () => a.dispose()
		};
	}
	buildCounterpart(e, t) {
		let n = {};
		for (let [r, i] of Object.entries(t)) {
			let t;
			t = i.kind === "request" ? i.isOptional ? async (t, n) => {
				t === void 0 && (t = {});
				try {
					return await e.request(i, t, n);
				} catch (e) {
					if (e && e.code === w.methodNotFound) return me;
					throw e;
				}
			} : (t, n) => (t === void 0 && (t = {}), e.request(i, t, n)) : (t, n) => (t === void 0 && (t = {}), e.notify(i, t, n)), n[r] = t;
		}
		return n;
	}
	registerHandlers(e, t, n, r) {
		let i = [];
		for (let [a, o] of Object.entries(t)) if (o.kind === "request") {
			let t = n[a];
			if (!t) continue;
			let s = this.createRequestHandler(r, t);
			i.push(e.registerRequestHandler(o, s));
		} else {
			let t = n[a];
			t && i.push(e.registerNotificationHandler(o, (e, n) => {
				t(e, {
					context: n,
					counterpart: r
				});
			}));
		}
		return { dispose: () => i.forEach((e) => e.dispose()) };
	}
	createRequestHandler(e, t) {
		return async (n, r, i) => {
			let a = await t(n, {
				context: i,
				counterpart: e,
				newErr: be.factory,
				requestId: r
			});
			return a instanceof be ? a.error : { ok: a };
		};
	}
	static getServerFromStream(e, t, n, r) {
		let i = _e.fromTransport(t, n), { server: a } = e.getServer(i, r);
		return i.startListen(), {
			channel: i,
			server: a
		};
	}
	static registerServerToStream(e, t, n, r) {
		let i = _e.fromTransport(t, n), { client: a } = e.registerServer(i, r);
		return i.startListen(), {
			channel: i,
			client: a
		};
	}
	getServer(e, t) {
		let { counterpart: n, dispose: r } = this.getInterface(e, this.client, this.server, t);
		return {
			server: n,
			dispose: r
		};
	}
	registerServer(e, t) {
		let { counterpart: n, dispose: r } = this.getInterface(e, this.server, this.client, t);
		return {
			client: n,
			dispose: r
		};
	}
	withContext() {
		return new e(this.tags, this.server, this.client);
	}
}, j = /* @__PURE__ */ (function(e) {
	return e.Comment = "comment", e.Imports = "imports", e.Region = "region", e;
})({}), M = /* @__PURE__ */ (function(e) {
	return e[e.File = 1] = "File", e[e.Module = 2] = "Module", e[e.Namespace = 3] = "Namespace", e[e.Package = 4] = "Package", e[e.Class = 5] = "Class", e[e.Method = 6] = "Method", e[e.Property = 7] = "Property", e[e.Field = 8] = "Field", e[e.Constructor = 9] = "Constructor", e[e.Enum = 10] = "Enum", e[e.Interface = 11] = "Interface", e[e.Function = 12] = "Function", e[e.Variable = 13] = "Variable", e[e.Constant = 14] = "Constant", e[e.String = 15] = "String", e[e.Number = 16] = "Number", e[e.Boolean = 17] = "Boolean", e[e.Array = 18] = "Array", e[e.Object = 19] = "Object", e[e.Key = 20] = "Key", e[e.Null = 21] = "Null", e[e.EnumMember = 22] = "EnumMember", e[e.Struct = 23] = "Struct", e[e.Event = 24] = "Event", e[e.Operator = 25] = "Operator", e[e.TypeParameter = 26] = "TypeParameter", e;
})({}), we = /* @__PURE__ */ (function(e) {
	return e[e.Deprecated = 1] = "Deprecated", e;
})({}), Te = /* @__PURE__ */ (function(e) {
	return e[e.Type = 1] = "Type", e[e.Parameter = 2] = "Parameter", e;
})({}), N = /* @__PURE__ */ (function(e) {
	return e[e.Text = 1] = "Text", e[e.Method = 2] = "Method", e[e.Function = 3] = "Function", e[e.Constructor = 4] = "Constructor", e[e.Field = 5] = "Field", e[e.Variable = 6] = "Variable", e[e.Class = 7] = "Class", e[e.Interface = 8] = "Interface", e[e.Module = 9] = "Module", e[e.Property = 10] = "Property", e[e.Unit = 11] = "Unit", e[e.Value = 12] = "Value", e[e.Enum = 13] = "Enum", e[e.Keyword = 14] = "Keyword", e[e.Snippet = 15] = "Snippet", e[e.Color = 16] = "Color", e[e.File = 17] = "File", e[e.Reference = 18] = "Reference", e[e.Folder = 19] = "Folder", e[e.EnumMember = 20] = "EnumMember", e[e.Constant = 21] = "Constant", e[e.Struct = 22] = "Struct", e[e.Event = 23] = "Event", e[e.Operator = 24] = "Operator", e[e.TypeParameter = 25] = "TypeParameter", e;
})({}), Ee = /* @__PURE__ */ (function(e) {
	return e[e.Deprecated = 1] = "Deprecated", e;
})({}), De = /* @__PURE__ */ (function(e) {
	return e[e.PlainText = 1] = "PlainText", e[e.Snippet = 2] = "Snippet", e;
})({}), P = /* @__PURE__ */ (function(e) {
	return e[e.Text = 1] = "Text", e[e.Read = 2] = "Read", e[e.Write = 3] = "Write", e;
})({}), F = /* @__PURE__ */ (function(e) {
	return e.Empty = "", e.QuickFix = "quickfix", e.Refactor = "refactor", e.RefactorExtract = "refactor.extract", e.RefactorInline = "refactor.inline", e.RefactorRewrite = "refactor.rewrite", e.Source = "source", e.SourceOrganizeImports = "source.organizeImports", e.SourceFixAll = "source.fixAll", e;
})({}), I = /* @__PURE__ */ (function(e) {
	return e[e.Error = 1] = "Error", e[e.Warning = 2] = "Warning", e[e.Information = 3] = "Information", e[e.Hint = 4] = "Hint", e;
})({}), Oe = /* @__PURE__ */ (function(e) {
	return e[e.Unnecessary = 1] = "Unnecessary", e[e.Deprecated = 2] = "Deprecated", e;
})({}), L = /* @__PURE__ */ (function(e) {
	return e[e.Invoked = 1] = "Invoked", e[e.TriggerCharacter = 2] = "TriggerCharacter", e[e.TriggerForIncompleteCompletions = 3] = "TriggerForIncompleteCompletions", e;
})({}), R = /* @__PURE__ */ (function(e) {
	return e[e.Invoked = 1] = "Invoked", e[e.TriggerCharacter = 2] = "TriggerCharacter", e[e.ContentChange = 3] = "ContentChange", e;
})({}), ke = /* @__PURE__ */ (function(e) {
	return e[e.Invoked = 1] = "Invoked", e[e.Automatic = 2] = "Automatic", e;
})({}), z = class {
	constructor(e) {
		this.method = e;
	}
}, Ae = {
	textDocumentImplementation: new z("textDocument/implementation"),
	textDocumentTypeDefinition: new z("textDocument/typeDefinition"),
	textDocumentDocumentColor: new z("textDocument/documentColor"),
	textDocumentColorPresentation: new z("textDocument/colorPresentation"),
	textDocumentFoldingRange: new z("textDocument/foldingRange"),
	textDocumentDeclaration: new z("textDocument/declaration"),
	textDocumentSelectionRange: new z("textDocument/selectionRange"),
	textDocumentPrepareCallHierarchy: new z("textDocument/prepareCallHierarchy"),
	textDocumentSemanticTokensFull: new z("textDocument/semanticTokens/full"),
	textDocumentSemanticTokensFullDelta: new z("textDocument/semanticTokens/full/delta"),
	textDocumentLinkedEditingRange: new z("textDocument/linkedEditingRange"),
	workspaceWillCreateFiles: new z("workspace/willCreateFiles"),
	workspaceWillRenameFiles: new z("workspace/willRenameFiles"),
	workspaceWillDeleteFiles: new z("workspace/willDeleteFiles"),
	textDocumentMoniker: new z("textDocument/moniker"),
	textDocumentPrepareTypeHierarchy: new z("textDocument/prepareTypeHierarchy"),
	textDocumentInlineValue: new z("textDocument/inlineValue"),
	textDocumentInlayHint: new z("textDocument/inlayHint"),
	textDocumentDiagnostic: new z("textDocument/diagnostic"),
	textDocumentInlineCompletion: new z("textDocument/inlineCompletion"),
	textDocumentWillSaveWaitUntil: new z("textDocument/willSaveWaitUntil"),
	textDocumentCompletion: new z("textDocument/completion"),
	textDocumentHover: new z("textDocument/hover"),
	textDocumentSignatureHelp: new z("textDocument/signatureHelp"),
	textDocumentDefinition: new z("textDocument/definition"),
	textDocumentReferences: new z("textDocument/references"),
	textDocumentDocumentHighlight: new z("textDocument/documentHighlight"),
	textDocumentDocumentSymbol: new z("textDocument/documentSymbol"),
	textDocumentCodeAction: new z("textDocument/codeAction"),
	workspaceSymbol: new z("workspace/symbol"),
	textDocumentCodeLens: new z("textDocument/codeLens"),
	textDocumentDocumentLink: new z("textDocument/documentLink"),
	textDocumentFormatting: new z("textDocument/formatting"),
	textDocumentRangeFormatting: new z("textDocument/rangeFormatting"),
	textDocumentRangesFormatting: new z("textDocument/rangesFormatting"),
	textDocumentOnTypeFormatting: new z("textDocument/onTypeFormatting"),
	textDocumentRename: new z("textDocument/rename"),
	workspaceExecuteCommand: new z("workspace/executeCommand"),
	workspaceDidCreateFiles: new z("workspace/didCreateFiles"),
	workspaceDidRenameFiles: new z("workspace/didRenameFiles"),
	workspaceDidDeleteFiles: new z("workspace/didDeleteFiles"),
	workspaceDidChangeConfiguration: new z("workspace/didChangeConfiguration"),
	textDocumentDidOpen: new z("textDocument/didOpen"),
	textDocumentDidChange: new z("textDocument/didChange"),
	textDocumentDidClose: new z("textDocument/didClose"),
	textDocumentDidSave: new z("textDocument/didSave"),
	textDocumentWillSave: new z("textDocument/willSave"),
	workspaceDidChangeWatchedFiles: new z("workspace/didChangeWatchedFiles")
};
xe({
	server: {
		textDocumentImplementation: k({ method: "textDocument/implementation" }),
		textDocumentTypeDefinition: k({ method: "textDocument/typeDefinition" }),
		textDocumentDocumentColor: k({ method: "textDocument/documentColor" }),
		textDocumentColorPresentation: k({ method: "textDocument/colorPresentation" }),
		textDocumentFoldingRange: k({ method: "textDocument/foldingRange" }),
		textDocumentDeclaration: k({ method: "textDocument/declaration" }),
		textDocumentSelectionRange: k({ method: "textDocument/selectionRange" }),
		textDocumentPrepareCallHierarchy: k({ method: "textDocument/prepareCallHierarchy" }),
		callHierarchyIncomingCalls: k({ method: "callHierarchy/incomingCalls" }),
		callHierarchyOutgoingCalls: k({ method: "callHierarchy/outgoingCalls" }),
		textDocumentSemanticTokensFull: k({ method: "textDocument/semanticTokens/full" }),
		textDocumentSemanticTokensFullDelta: k({ method: "textDocument/semanticTokens/full/delta" }),
		textDocumentSemanticTokensRange: k({ method: "textDocument/semanticTokens/range" }),
		textDocumentLinkedEditingRange: k({ method: "textDocument/linkedEditingRange" }),
		workspaceWillCreateFiles: k({ method: "workspace/willCreateFiles" }),
		workspaceWillRenameFiles: k({ method: "workspace/willRenameFiles" }),
		workspaceWillDeleteFiles: k({ method: "workspace/willDeleteFiles" }),
		textDocumentMoniker: k({ method: "textDocument/moniker" }),
		textDocumentPrepareTypeHierarchy: k({ method: "textDocument/prepareTypeHierarchy" }),
		typeHierarchySupertypes: k({ method: "typeHierarchy/supertypes" }),
		typeHierarchySubtypes: k({ method: "typeHierarchy/subtypes" }),
		textDocumentInlineValue: k({ method: "textDocument/inlineValue" }),
		textDocumentInlayHint: k({ method: "textDocument/inlayHint" }),
		inlayHintResolve: k({ method: "inlayHint/resolve" }),
		textDocumentDiagnostic: k({ method: "textDocument/diagnostic" }),
		workspaceDiagnostic: k({ method: "workspace/diagnostic" }),
		textDocumentInlineCompletion: k({ method: "textDocument/inlineCompletion" }),
		initialize: k({ method: "initialize" }),
		shutdown: k({ method: "shutdown" }),
		textDocumentWillSaveWaitUntil: k({ method: "textDocument/willSaveWaitUntil" }),
		textDocumentCompletion: k({ method: "textDocument/completion" }),
		completionItemResolve: k({ method: "completionItem/resolve" }),
		textDocumentHover: k({ method: "textDocument/hover" }),
		textDocumentSignatureHelp: k({ method: "textDocument/signatureHelp" }),
		textDocumentDefinition: k({ method: "textDocument/definition" }),
		textDocumentReferences: k({ method: "textDocument/references" }),
		textDocumentDocumentHighlight: k({ method: "textDocument/documentHighlight" }),
		textDocumentDocumentSymbol: k({ method: "textDocument/documentSymbol" }),
		textDocumentCodeAction: k({ method: "textDocument/codeAction" }),
		codeActionResolve: k({ method: "codeAction/resolve" }),
		workspaceSymbol: k({ method: "workspace/symbol" }),
		workspaceSymbolResolve: k({ method: "workspaceSymbol/resolve" }),
		textDocumentCodeLens: k({ method: "textDocument/codeLens" }),
		codeLensResolve: k({ method: "codeLens/resolve" }),
		textDocumentDocumentLink: k({ method: "textDocument/documentLink" }),
		documentLinkResolve: k({ method: "documentLink/resolve" }),
		textDocumentFormatting: k({ method: "textDocument/formatting" }),
		textDocumentRangeFormatting: k({ method: "textDocument/rangeFormatting" }),
		textDocumentRangesFormatting: k({ method: "textDocument/rangesFormatting" }),
		textDocumentOnTypeFormatting: k({ method: "textDocument/onTypeFormatting" }),
		textDocumentRename: k({ method: "textDocument/rename" }),
		textDocumentPrepareRename: k({ method: "textDocument/prepareRename" }),
		workspaceExecuteCommand: k({ method: "workspace/executeCommand" }),
		workspaceDidChangeWorkspaceFolders: A({ method: "workspace/didChangeWorkspaceFolders" }),
		windowWorkDoneProgressCancel: A({ method: "window/workDoneProgress/cancel" }),
		workspaceDidCreateFiles: A({ method: "workspace/didCreateFiles" }),
		workspaceDidRenameFiles: A({ method: "workspace/didRenameFiles" }),
		workspaceDidDeleteFiles: A({ method: "workspace/didDeleteFiles" }),
		notebookDocumentDidOpen: A({ method: "notebookDocument/didOpen" }),
		notebookDocumentDidChange: A({ method: "notebookDocument/didChange" }),
		notebookDocumentDidSave: A({ method: "notebookDocument/didSave" }),
		notebookDocumentDidClose: A({ method: "notebookDocument/didClose" }),
		initialized: A({ method: "initialized" }),
		exit: A({ method: "exit" }),
		workspaceDidChangeConfiguration: A({ method: "workspace/didChangeConfiguration" }),
		textDocumentDidOpen: A({ method: "textDocument/didOpen" }),
		textDocumentDidChange: A({ method: "textDocument/didChange" }),
		textDocumentDidClose: A({ method: "textDocument/didClose" }),
		textDocumentDidSave: A({ method: "textDocument/didSave" }),
		textDocumentWillSave: A({ method: "textDocument/willSave" }),
		workspaceDidChangeWatchedFiles: A({ method: "workspace/didChangeWatchedFiles" }),
		setTrace: A({ method: "$/setTrace" }),
		cancelRequest: A({ method: "$/cancelRequest" }),
		progress: A({ method: "$/progress" })
	},
	client: {
		workspaceWorkspaceFolders: k({ method: "workspace/workspaceFolders" }).optional(),
		workspaceConfiguration: k({ method: "workspace/configuration" }).optional(),
		workspaceFoldingRangeRefresh: k({ method: "workspace/foldingRange/refresh" }).optional(),
		windowWorkDoneProgressCreate: k({ method: "window/workDoneProgress/create" }).optional(),
		workspaceSemanticTokensRefresh: k({ method: "workspace/semanticTokens/refresh" }).optional(),
		windowShowDocument: k({ method: "window/showDocument" }).optional(),
		workspaceInlineValueRefresh: k({ method: "workspace/inlineValue/refresh" }).optional(),
		workspaceInlayHintRefresh: k({ method: "workspace/inlayHint/refresh" }).optional(),
		workspaceDiagnosticRefresh: k({ method: "workspace/diagnostic/refresh" }).optional(),
		clientRegisterCapability: k({ method: "client/registerCapability" }).optional(),
		clientUnregisterCapability: k({ method: "client/unregisterCapability" }).optional(),
		windowShowMessageRequest: k({ method: "window/showMessageRequest" }).optional(),
		workspaceCodeLensRefresh: k({ method: "workspace/codeLens/refresh" }).optional(),
		workspaceApplyEdit: k({ method: "workspace/applyEdit" }).optional(),
		windowShowMessage: A({ method: "window/showMessage" }),
		windowLogMessage: A({ method: "window/logMessage" }),
		telemetryEvent: A({ method: "telemetry/event" }),
		textDocumentPublishDiagnostics: A({ method: "textDocument/publishDiagnostics" }),
		logTrace: A({ method: "$/logTrace" }),
		cancelRequest: A({ method: "$/cancelRequest" }),
		progress: A({ method: "$/progress" })
	}
}), ne = class {
	constructor() {
		y(this, "_store", new je());
	}
	dispose() {
		this._store.dispose();
	}
	_register(e) {
		if (e === this) throw Error("Cannot register a disposable on itself!");
		return this._store.add(e);
	}
}, y(ne, "None", Object.freeze({ dispose() {} }));
var je = (C = class {
	constructor() {
		y(this, "_toDispose", /* @__PURE__ */ new Set()), y(this, "_isDisposed", !1);
	}
	dispose() {
		this._isDisposed || (this._isDisposed = !0, this.clear());
	}
	clear() {
		if (this._toDispose.size !== 0) try {
			for (let e of this._toDispose) e.dispose();
		} finally {
			this._toDispose.clear();
		}
	}
	add(e) {
		if (!e) return e;
		if (e === this) throw Error("Cannot register a disposable on itself!");
		return this._isDisposed ? C.DISABLE_DISPOSED_WARNING || console.warn((/* @__PURE__ */ Error("Trying to add a disposable to a DisposableStore that has already been disposed of. The added object will be leaked!")).stack) : this._toDispose.add(e), e;
	}
}, y(C, "DISABLE_DISPOSED_WARNING", !1), C);
F.Empty, F.QuickFix, F.Refactor, F.RefactorExtract, F.RefactorInline, F.RefactorRewrite, F.Source, F.SourceOrganizeImports, F.SourceFixAll, o.CodeActionTriggerType.Invoke, ke.Invoked, o.CodeActionTriggerType.Auto, ke.Automatic, N.Text, o.CompletionItemKind.Text, N.Method, o.CompletionItemKind.Method, N.Function, o.CompletionItemKind.Function, N.Constructor, o.CompletionItemKind.Constructor, N.Field, o.CompletionItemKind.Field, N.Variable, o.CompletionItemKind.Variable, N.Class, o.CompletionItemKind.Class, N.Interface, o.CompletionItemKind.Interface, N.Module, o.CompletionItemKind.Module, N.Property, o.CompletionItemKind.Property, N.Unit, o.CompletionItemKind.Unit, N.Value, o.CompletionItemKind.Value, N.Enum, o.CompletionItemKind.Enum, N.Keyword, o.CompletionItemKind.Keyword, N.Snippet, o.CompletionItemKind.Snippet, N.Color, o.CompletionItemKind.Color, N.File, o.CompletionItemKind.File, N.Reference, o.CompletionItemKind.Reference, N.Folder, o.CompletionItemKind.Folder, N.EnumMember, o.CompletionItemKind.EnumMember, N.Constant, o.CompletionItemKind.Constant, N.Struct, o.CompletionItemKind.Struct, N.Event, o.CompletionItemKind.Event, N.Operator, o.CompletionItemKind.Operator, N.TypeParameter, o.CompletionItemKind.TypeParameter, Ee.Deprecated, o.CompletionItemTag.Deprecated, o.CompletionTriggerKind.Invoke, L.Invoked, o.CompletionTriggerKind.TriggerCharacter, L.TriggerCharacter, o.CompletionTriggerKind.TriggerForIncompleteCompletions, L.TriggerForIncompleteCompletions, De.Snippet, o.CompletionItemInsertTextRule.InsertAsSnippet, M.File, o.SymbolKind.File, M.Module, o.SymbolKind.Module, M.Namespace, o.SymbolKind.Namespace, M.Package, o.SymbolKind.Package, M.Class, o.SymbolKind.Class, M.Method, o.SymbolKind.Method, M.Property, o.SymbolKind.Property, M.Field, o.SymbolKind.Field, M.Constructor, o.SymbolKind.Constructor, M.Enum, o.SymbolKind.Enum, M.Interface, o.SymbolKind.Interface, M.Function, o.SymbolKind.Function, M.Variable, o.SymbolKind.Variable, M.Constant, o.SymbolKind.Constant, M.String, o.SymbolKind.String, M.Number, o.SymbolKind.Number, M.Boolean, o.SymbolKind.Boolean, M.Array, o.SymbolKind.Array, M.Object, o.SymbolKind.Object, M.Key, o.SymbolKind.Key, M.Null, o.SymbolKind.Null, M.EnumMember, o.SymbolKind.EnumMember, M.Struct, o.SymbolKind.Struct, M.Event, o.SymbolKind.Event, M.Operator, o.SymbolKind.Operator, M.TypeParameter, o.SymbolKind.TypeParameter, we.Deprecated, o.SymbolTag.Deprecated, P.Text, o.DocumentHighlightKind.Text, P.Read, o.DocumentHighlightKind.Read, P.Write, o.DocumentHighlightKind.Write, j.Comment, o.FoldingRangeKind.Comment, j.Imports, o.FoldingRangeKind.Imports, j.Region, o.FoldingRangeKind.Region, a.Error, I.Error, a.Warning, I.Warning, a.Info, I.Information, a.Hint, I.Hint, I.Error, a.Error, I.Warning, a.Warning, I.Information, a.Info, I.Hint, a.Hint, Oe.Unnecessary, r.Unnecessary, Oe.Deprecated, r.Deprecated, o.SignatureHelpTriggerKind.Invoke, R.Invoked, o.SignatureHelpTriggerKind.TriggerCharacter, R.TriggerCharacter, o.SignatureHelpTriggerKind.ContentChange, R.ContentChange, Te.Type, o.InlayHintKind.Type, Te.Parameter, o.InlayHintKind.Parameter, new Map([...Object.values(Ae)].map((e) => [e.method, e])), typeof WebSocket < "u" || (typeof MozWebSocket < "u" ? MozWebSocket : typeof global < "u" ? global.WebSocket || global.MozWebSocket : typeof window < "u" ? window.WebSocket || window.MozWebSocket : typeof self < "u" && (self.WebSocket || self.MozWebSocket));
//#endregion
//#region node_modules/monaco-editor/esm/vs/languages/definitions/_.contribution.js
var Me = {}, B = {}, Ne = class e {
	static getOrCreate(t) {
		return B[t] || (B[t] = new e(t)), B[t];
	}
	constructor(e) {
		this._languageId = e, this._loadingTriggered = !1, this._lazyLoadPromise = new Promise((e, t) => {
			this._lazyLoadPromiseResolve = e, this._lazyLoadPromiseReject = t;
		});
	}
	load() {
		return this._loadingTriggered || (this._loadingTriggered = !0, Me[this._languageId].loader().then((e) => this._lazyLoadPromiseResolve(e), (e) => this._lazyLoadPromiseReject(e))), this._lazyLoadPromise;
	}
};
function V(e) {
	let t = e.id;
	Me[t] = e, o.register(e);
	let n = Ne.getOrCreate(t);
	o.registerTokensProviderFactory(t, { create: async () => (await n.load()).language }), o.onLanguageEncountered(t, async () => {
		let e = await n.load();
		o.setLanguageConfiguration(t, e.conf);
	});
}
//#endregion
//#region node_modules/monaco-editor/esm/vs/languages/definitions/yaml/register.js
V({
	id: "abap",
	extensions: [".abap"],
	aliases: ["abap", "ABAP"],
	loader: () => import("./abap-CfCwO0wY.js")
}), V({
	id: "apex",
	extensions: [".cls"],
	aliases: ["Apex", "apex"],
	mimetypes: ["text/x-apex-source", "text/x-apex"],
	loader: () => import("./apex-adZnEfO4.js")
}), V({
	id: "azcli",
	extensions: [".azcli"],
	aliases: ["Azure CLI", "azcli"],
	loader: () => import("./azcli-CLGNa0wF.js")
}), V({
	id: "bat",
	extensions: [".bat", ".cmd"],
	aliases: ["Batch", "bat"],
	loader: () => import("./bat-CAz1OfAu.js")
}), V({
	id: "bicep",
	extensions: [".bicep"],
	aliases: ["Bicep"],
	loader: () => import("./bicep-B6UDBWZN.js")
}), V({
	id: "cameligo",
	extensions: [".mligo"],
	aliases: ["Cameligo"],
	loader: () => import("./cameligo-DbbJwPXc.js")
}), V({
	id: "clojure",
	extensions: [
		".clj",
		".cljs",
		".cljc",
		".edn"
	],
	aliases: ["clojure", "Clojure"],
	loader: () => import("./clojure-BmcSQAck.js")
}), V({
	id: "coffeescript",
	extensions: [".coffee"],
	aliases: [
		"CoffeeScript",
		"coffeescript",
		"coffee"
	],
	mimetypes: ["text/x-coffeescript", "text/coffeescript"],
	loader: () => import("./coffee-BjQKeqpj.js")
}), V({
	id: "c",
	extensions: [".c", ".h"],
	aliases: ["C", "c"],
	loader: () => import("./cpp-SbfDT5PL.js")
}), V({
	id: "cpp",
	extensions: [
		".cpp",
		".cc",
		".cxx",
		".hpp",
		".hh",
		".hxx"
	],
	aliases: [
		"C++",
		"Cpp",
		"cpp"
	],
	loader: () => import("./cpp-SbfDT5PL.js")
}), V({
	id: "csharp",
	extensions: [
		".cs",
		".csx",
		".cake"
	],
	aliases: ["C#", "csharp"],
	loader: () => import("./csharp-DIgVBsD4.js")
}), V({
	id: "csp",
	extensions: [".csp"],
	aliases: ["CSP", "csp"],
	loader: () => import("./csp-DvdhxaNC.js")
}), V({
	id: "css",
	extensions: [".css"],
	aliases: ["CSS", "css"],
	mimetypes: ["text/css"],
	loader: () => import("./css-CyL9hcFb.js")
}), V({
	id: "cypher",
	extensions: [".cypher", ".cyp"],
	aliases: ["Cypher", "OpenCypher"],
	loader: () => import("./cypher-CFQunzEa.js")
}), V({
	id: "dart",
	extensions: [".dart"],
	aliases: ["Dart", "dart"],
	mimetypes: ["text/x-dart-source", "text/x-dart"],
	loader: () => import("./dart-DeIsDVRt.js")
}), V({
	id: "dockerfile",
	extensions: [".dockerfile"],
	filenames: ["Dockerfile"],
	aliases: ["Dockerfile"],
	loader: () => import("./dockerfile-Yk3LuDQk.js")
}), V({
	id: "ecl",
	extensions: [".ecl"],
	aliases: [
		"ECL",
		"Ecl",
		"ecl"
	],
	loader: () => import("./ecl-BLFA7ldk.js")
}), V({
	id: "elixir",
	extensions: [".ex", ".exs"],
	aliases: [
		"Elixir",
		"elixir",
		"ex"
	],
	loader: () => import("./elixir-y_NY5k67.js")
}), V({
	id: "flow9",
	extensions: [".flow"],
	aliases: [
		"Flow9",
		"Flow",
		"flow9",
		"flow"
	],
	loader: () => import("./flow9-DNlf0Ct1.js")
}), V({
	id: "fsharp",
	extensions: [
		".fs",
		".fsi",
		".ml",
		".mli",
		".fsx",
		".fsscript"
	],
	aliases: [
		"F#",
		"FSharp",
		"fsharp"
	],
	loader: () => import("./fsharp-DdRbc-sH.js")
}), V({
	id: "freemarker2",
	extensions: [
		".ftl",
		".ftlh",
		".ftlx"
	],
	aliases: ["FreeMarker2", "Apache FreeMarker2"],
	loader: () => import("./freemarker2-D5E5wqid.js").then((e) => e.TagAutoInterpolationDollar)
}), V({
	id: "freemarker2.tag-angle.interpolation-dollar",
	aliases: ["FreeMarker2 (Angle/Dollar)", "Apache FreeMarker2 (Angle/Dollar)"],
	loader: () => import("./freemarker2-D5E5wqid.js").then((e) => e.TagAngleInterpolationDollar)
}), V({
	id: "freemarker2.tag-bracket.interpolation-dollar",
	aliases: ["FreeMarker2 (Bracket/Dollar)", "Apache FreeMarker2 (Bracket/Dollar)"],
	loader: () => import("./freemarker2-D5E5wqid.js").then((e) => e.TagBracketInterpolationDollar)
}), V({
	id: "freemarker2.tag-angle.interpolation-bracket",
	aliases: ["FreeMarker2 (Angle/Bracket)", "Apache FreeMarker2 (Angle/Bracket)"],
	loader: () => import("./freemarker2-D5E5wqid.js").then((e) => e.TagAngleInterpolationBracket)
}), V({
	id: "freemarker2.tag-bracket.interpolation-bracket",
	aliases: ["FreeMarker2 (Bracket/Bracket)", "Apache FreeMarker2 (Bracket/Bracket)"],
	loader: () => import("./freemarker2-D5E5wqid.js").then((e) => e.TagBracketInterpolationBracket)
}), V({
	id: "freemarker2.tag-auto.interpolation-dollar",
	aliases: ["FreeMarker2 (Auto/Dollar)", "Apache FreeMarker2 (Auto/Dollar)"],
	loader: () => import("./freemarker2-D5E5wqid.js").then((e) => e.TagAutoInterpolationDollar)
}), V({
	id: "freemarker2.tag-auto.interpolation-bracket",
	aliases: ["FreeMarker2 (Auto/Bracket)", "Apache FreeMarker2 (Auto/Bracket)"],
	loader: () => import("./freemarker2-D5E5wqid.js").then((e) => e.TagAutoInterpolationBracket)
}), V({
	id: "go",
	extensions: [".go"],
	aliases: ["Go"],
	loader: () => import("./go-D7w79i6g.js")
}), V({
	id: "graphql",
	extensions: [".graphql", ".gql"],
	aliases: [
		"GraphQL",
		"graphql",
		"gql"
	],
	mimetypes: ["application/graphql"],
	loader: () => import("./graphql-BsDuKp-c.js")
}), V({
	id: "handlebars",
	extensions: [".handlebars", ".hbs"],
	aliases: [
		"Handlebars",
		"handlebars",
		"hbs"
	],
	mimetypes: ["text/x-handlebars-template"],
	loader: () => import("./handlebars-BvRWHA-H.js")
}), V({
	id: "hcl",
	extensions: [
		".tf",
		".tfvars",
		".hcl"
	],
	aliases: [
		"Terraform",
		"tf",
		"HCL",
		"hcl"
	],
	loader: () => import("./hcl-CXnaLDBx.js")
}), V({
	id: "html",
	extensions: [
		".html",
		".htm",
		".shtml",
		".xhtml",
		".mdoc",
		".jsp",
		".asp",
		".aspx",
		".jshtm"
	],
	aliases: [
		"HTML",
		"htm",
		"html",
		"xhtml"
	],
	mimetypes: [
		"text/html",
		"text/x-jshtm",
		"text/template",
		"text/ng-template"
	],
	loader: () => import("./html-QQHrgZa1.js")
}), V({
	id: "ini",
	extensions: [
		".ini",
		".properties",
		".gitconfig"
	],
	filenames: [
		"config",
		".gitattributes",
		".gitconfig",
		".editorconfig"
	],
	aliases: ["Ini", "ini"],
	loader: () => import("./ini-DAoNsTkV.js")
}), V({
	id: "java",
	extensions: [".java", ".jav"],
	aliases: ["Java", "java"],
	mimetypes: ["text/x-java-source", "text/x-java"],
	loader: () => import("./java-Cp0vrvO9.js")
}), V({
	id: "javascript",
	extensions: [
		".js",
		".es6",
		".jsx",
		".mjs",
		".cjs"
	],
	firstLine: "^#!.*\\bnode",
	filenames: ["jakefile"],
	aliases: [
		"JavaScript",
		"javascript",
		"js"
	],
	mimetypes: ["text/javascript"],
	loader: () => import("./javascript-C8CHcP8h.js")
}), V({
	id: "julia",
	extensions: [".jl"],
	aliases: ["julia", "Julia"],
	loader: () => import("./julia-CVutXSdh.js")
}), V({
	id: "kotlin",
	extensions: [".kt", ".kts"],
	aliases: ["Kotlin", "kotlin"],
	mimetypes: ["text/x-kotlin-source", "text/x-kotlin"],
	loader: () => import("./kotlin-DYeWZuUb.js")
}), V({
	id: "less",
	extensions: [".less"],
	aliases: ["Less", "less"],
	mimetypes: ["text/x-less", "text/less"],
	loader: () => import("./less-INmgXeDn.js")
}), V({
	id: "lexon",
	extensions: [".lex"],
	aliases: ["Lexon"],
	loader: () => import("./lexon-6WvX9sfN.js")
}), V({
	id: "lua",
	extensions: [".lua"],
	aliases: ["Lua", "lua"],
	loader: () => import("./lua-COF3XwLj.js")
}), V({
	id: "liquid",
	extensions: [".liquid", ".html.liquid"],
	aliases: ["Liquid", "liquid"],
	mimetypes: ["application/liquid"],
	loader: () => import("./liquid-DF5W_hwb.js")
}), V({
	id: "m3",
	extensions: [
		".m3",
		".i3",
		".mg",
		".ig"
	],
	aliases: [
		"Modula-3",
		"Modula3",
		"modula3",
		"m3"
	],
	loader: () => import("./m3-BEIPFJxi.js")
}), V({
	id: "markdown",
	extensions: [
		".md",
		".markdown",
		".mdown",
		".mkdn",
		".mkd",
		".mdwn",
		".mdtxt",
		".mdtext"
	],
	aliases: ["Markdown", "markdown"],
	loader: () => import("./markdown-CCGC2kAW.js")
}), V({
	id: "mdx",
	extensions: [".mdx"],
	aliases: ["MDX", "mdx"],
	loader: () => import("./mdx-DHxuA8zs.js")
}), V({
	id: "mips",
	extensions: [".s"],
	aliases: ["MIPS", "MIPS-V"],
	mimetypes: [
		"text/x-mips",
		"text/mips",
		"text/plaintext"
	],
	loader: () => import("./mips-ll8pdQLQ.js")
}), V({
	id: "msdax",
	extensions: [".dax", ".msdax"],
	aliases: ["DAX", "MSDAX"],
	loader: () => import("./msdax-B5WVqOWw.js")
}), V({
	id: "mysql",
	extensions: [],
	aliases: ["MySQL", "mysql"],
	loader: () => import("./mysql-CnCmYLcK.js")
}), V({
	id: "objective-c",
	extensions: [".m"],
	aliases: ["Objective-C"],
	loader: () => import("./objective-c-D-xZGaTr.js")
}), V({
	id: "pascal",
	extensions: [
		".pas",
		".p",
		".pp"
	],
	aliases: ["Pascal", "pas"],
	mimetypes: ["text/x-pascal-source", "text/x-pascal"],
	loader: () => import("./pascal-CKVRL3bp.js")
}), V({
	id: "pascaligo",
	extensions: [".ligo"],
	aliases: ["Pascaligo", "ligo"],
	loader: () => import("./pascaligo-DY-d5ac0.js")
}), V({
	id: "perl",
	extensions: [".pl", ".pm"],
	aliases: ["Perl", "pl"],
	loader: () => import("./perl-DqL2sfnN.js")
}), V({
	id: "pgsql",
	extensions: [],
	aliases: [
		"PostgreSQL",
		"postgres",
		"pg",
		"postgre"
	],
	loader: () => import("./pgsql-BpvbArh-.js")
}), V({
	id: "php",
	extensions: [
		".php",
		".php4",
		".php5",
		".phtml",
		".ctp"
	],
	aliases: ["PHP", "php"],
	mimetypes: ["application/x-php"],
	loader: () => import("./php-BbqlrNqC.js")
}), V({
	id: "pla",
	extensions: [".pla"],
	loader: () => import("./pla-BhpV5iom.js")
}), V({
	id: "postiats",
	extensions: [
		".dats",
		".sats",
		".hats"
	],
	aliases: ["ATS", "ATS/Postiats"],
	loader: () => import("./postiats-oh_Dlofq.js")
}), V({
	id: "powerquery",
	extensions: [".pq", ".pqm"],
	aliases: [
		"PQ",
		"M",
		"Power Query",
		"Power Query M"
	],
	loader: () => import("./powerquery-DuSN2JW8.js")
}), V({
	id: "powershell",
	extensions: [
		".ps1",
		".psm1",
		".psd1"
	],
	aliases: [
		"PowerShell",
		"powershell",
		"ps",
		"ps1"
	],
	loader: () => import("./powershell-0oEoSDwW.js")
}), V({
	id: "proto",
	extensions: [".proto"],
	aliases: ["protobuf", "Protocol Buffers"],
	loader: () => import("./protobuf-DlOMtU4U.js")
}), V({
	id: "pug",
	extensions: [".jade", ".pug"],
	aliases: [
		"Pug",
		"Jade",
		"jade"
	],
	loader: () => import("./pug-CTxaaQKP.js")
}), V({
	id: "python",
	extensions: [
		".py",
		".rpy",
		".pyw",
		".cpy",
		".gyp",
		".gypi"
	],
	aliases: ["Python", "py"],
	firstLine: "^#!/.*\\bpython[0-9.-]*\\b",
	loader: () => import("./python-D6Nsbkja.js")
}), V({
	id: "qsharp",
	extensions: [".qs"],
	aliases: ["Q#", "qsharp"],
	loader: () => import("./qsharp-Bp73mf5Z.js")
}), V({
	id: "r",
	extensions: [
		".r",
		".rhistory",
		".rmd",
		".rprofile",
		".rt"
	],
	aliases: ["R", "r"],
	loader: () => import("./r-DF_g8_2l.js")
}), V({
	id: "razor",
	extensions: [".cshtml"],
	aliases: ["Razor", "razor"],
	mimetypes: ["text/x-cshtml"],
	loader: () => import("./razor-ZYDBbK7D.js")
}), V({
	id: "redis",
	extensions: [".redis"],
	aliases: ["redis"],
	loader: () => import("./redis-B09Z6nB5.js")
}), V({
	id: "redshift",
	extensions: [],
	aliases: ["Redshift", "redshift"],
	loader: () => import("./redshift-WjSjVhoV.js")
}), V({
	id: "restructuredtext",
	extensions: [".rst"],
	aliases: ["reStructuredText", "restructuredtext"],
	loader: () => import("./restructuredtext-TuEti2mf.js")
}), V({
	id: "ruby",
	extensions: [
		".rb",
		".rbx",
		".rjs",
		".gemspec",
		".pp"
	],
	filenames: ["rakefile", "Gemfile"],
	aliases: ["Ruby", "rb"],
	loader: () => import("./ruby-CWBObvDC.js")
}), V({
	id: "rust",
	extensions: [".rs", ".rlib"],
	aliases: ["Rust", "rust"],
	loader: () => import("./rust-DdLDSWVK.js")
}), V({
	id: "sb",
	extensions: [".sb"],
	aliases: ["Small Basic", "sb"],
	loader: () => import("./sb-CfyYm0fs.js")
}), V({
	id: "scala",
	extensions: [
		".scala",
		".sc",
		".sbt"
	],
	aliases: [
		"Scala",
		"scala",
		"SBT",
		"Sbt",
		"sbt",
		"Dotty",
		"dotty"
	],
	mimetypes: [
		"text/x-scala-source",
		"text/x-scala",
		"text/x-sbt",
		"text/x-dotty"
	],
	loader: () => import("./scala-Bg3GaqPc.js")
}), V({
	id: "scheme",
	extensions: [
		".scm",
		".ss",
		".sch",
		".rkt"
	],
	aliases: ["scheme", "Scheme"],
	loader: () => import("./scheme-DGoR7CnT.js")
}), V({
	id: "scss",
	extensions: [".scss"],
	aliases: [
		"Sass",
		"sass",
		"scss"
	],
	mimetypes: ["text/x-scss", "text/scss"],
	loader: () => import("./scss-D-qk8UVY.js")
}), V({
	id: "shell",
	extensions: [".sh", ".bash"],
	aliases: ["Shell", "sh"],
	loader: () => import("./shell-CpVOERQd.js")
}), V({
	id: "sol",
	extensions: [".sol"],
	aliases: [
		"sol",
		"solidity",
		"Solidity"
	],
	loader: () => import("./solidity-CVmhJ22u.js")
}), V({
	id: "aes",
	extensions: [".aes"],
	aliases: [
		"aes",
		"sophia",
		"Sophia"
	],
	loader: () => import("./sophia-DGSFfDWE.js")
}), V({
	id: "sparql",
	extensions: [".rq"],
	aliases: ["sparql", "SPARQL"],
	loader: () => import("./sparql-BXIHBfyc.js")
}), V({
	id: "sql",
	extensions: [".sql"],
	aliases: ["SQL"],
	loader: () => import("./sql-DHvzW7ba.js")
}), V({
	id: "st",
	extensions: [
		".st",
		".iecst",
		".iecplc",
		".lc3lib",
		".TcPOU",
		".TcDUT",
		".TcGVL",
		".TcIO"
	],
	aliases: [
		"StructuredText",
		"scl",
		"stl"
	],
	loader: () => import("./st-CKElxhZl.js")
}), V({
	id: "swift",
	aliases: ["Swift", "swift"],
	extensions: [".swift"],
	mimetypes: ["text/swift"],
	loader: () => import("./swift-DIkzszb_.js")
}), V({
	id: "systemverilog",
	extensions: [".sv", ".svh"],
	aliases: [
		"SV",
		"sv",
		"SystemVerilog",
		"systemverilog"
	],
	loader: () => import("./systemverilog-T3rz_k7V.js")
}), V({
	id: "verilog",
	extensions: [".v", ".vh"],
	aliases: [
		"V",
		"v",
		"Verilog",
		"verilog"
	],
	loader: () => import("./systemverilog-T3rz_k7V.js")
}), V({
	id: "tcl",
	extensions: [".tcl"],
	aliases: [
		"tcl",
		"Tcl",
		"tcltk",
		"TclTk",
		"tcl/tk",
		"Tcl/Tk"
	],
	loader: () => import("./tcl-D7mHOiU2.js")
}), V({
	id: "twig",
	extensions: [".twig"],
	aliases: ["Twig", "twig"],
	mimetypes: ["text/x-twig"],
	loader: () => import("./twig-CWOr6DII.js")
}), V({
	id: "typescript",
	extensions: [
		".ts",
		".tsx",
		".cts",
		".mts"
	],
	aliases: [
		"TypeScript",
		"ts",
		"typescript"
	],
	mimetypes: ["text/typescript"],
	loader: () => import("./typescript-CJUKd2Sz.js")
}), V({
	id: "typespec",
	extensions: [".tsp"],
	aliases: ["TypeSpec"],
	loader: () => import("./typespec-4ubJw-FV.js")
}), V({
	id: "vb",
	extensions: [".vb"],
	aliases: ["Visual Basic", "vb"],
	loader: () => import("./vb-SSAHHOVh.js")
}), V({
	id: "wgsl",
	extensions: [".wgsl"],
	aliases: [
		"WebGPU Shading Language",
		"WGSL",
		"wgsl"
	],
	loader: () => import("./wgsl-hf5cqFtC.js")
}), V({
	id: "xml",
	extensions: [
		".xml",
		".xsd",
		".dtd",
		".ascx",
		".csproj",
		".config",
		".props",
		".targets",
		".wxi",
		".wxl",
		".wxs",
		".xaml",
		".svg",
		".svgz",
		".opf",
		".xslt",
		".xsl"
	],
	firstLine: "(\\<\\?xml.*)|(\\<svg)|(\\<\\!doctype\\s+svg)",
	aliases: ["XML", "xml"],
	mimetypes: [
		"text/xml",
		"application/xml",
		"application/xaml+xml",
		"application/xml-dtd"
	],
	loader: () => import("./xml-TiVz6QU7.js")
}), V({
	id: "yaml",
	extensions: [".yaml", ".yml"],
	aliases: [
		"YAML",
		"yaml",
		"YML",
		"yml"
	],
	mimetypes: ["application/x-yaml", "text/x-yaml"],
	loader: () => import("./yaml-uvtwgRZg.js")
});
//#endregion
//#region node_modules/monaco-editor/esm/vs/languages/features/css/register.js
var H = class {
	constructor(e, t, n) {
		this._onDidChange = new l(), this._languageId = e, this.setOptions(t), this.setModeConfiguration(n);
	}
	get onDidChange() {
		return this._onDidChange.event;
	}
	get languageId() {
		return this._languageId;
	}
	get modeConfiguration() {
		return this._modeConfiguration;
	}
	get diagnosticsOptions() {
		return this.options;
	}
	get options() {
		return this._options;
	}
	setOptions(e) {
		this._options = e || /* @__PURE__ */ Object.create(null), this._onDidChange.fire(this);
	}
	setDiagnosticsOptions(e) {
		this.setOptions(e);
	}
	setModeConfiguration(e) {
		this._modeConfiguration = e || /* @__PURE__ */ Object.create(null), this._onDidChange.fire(this);
	}
}, U = {
	validate: !0,
	lint: {
		compatibleVendorPrefixes: "ignore",
		vendorPrefix: "warning",
		duplicateProperties: "warning",
		emptyRules: "warning",
		importStatement: "ignore",
		boxModel: "ignore",
		universalSelector: "ignore",
		zeroUnits: "ignore",
		fontFaceProperties: "warning",
		hexColorLength: "error",
		argumentsInColorFunction: "error",
		unknownProperties: "warning",
		ieHack: "ignore",
		unknownVendorSpecificProperties: "ignore",
		propertyIgnoredDueToDisplay: "warning",
		important: "ignore",
		float: "ignore",
		idSelector: "ignore"
	},
	data: { useDefaultDataProvider: !0 },
	format: {
		newlineBetweenSelectors: !0,
		newlineBetweenRules: !0,
		spaceAroundSelectorSeparator: !1,
		braceStyle: "collapse",
		maxPreserveNewLines: void 0,
		preserveNewLines: !0
	}
}, W = {
	completionItems: !0,
	hovers: !0,
	documentSymbols: !0,
	definitions: !0,
	references: !0,
	documentHighlights: !0,
	rename: !0,
	colors: !0,
	foldingRanges: !0,
	diagnostics: !0,
	selectionRanges: !0,
	documentFormattingEdits: !0,
	documentRangeFormattingEdits: !0
}, Pe = new H("css", U, W), Fe = new H("scss", U, W), Ie = new H("less", U, W);
function G() {
	return import("./cssMode-BlgggzMT.js");
}
o.onLanguage("less", () => {
	G().then((e) => e.setupMode(Ie));
}), o.onLanguage("scss", () => {
	G().then((e) => e.setupMode(Fe));
}), o.onLanguage("css", () => {
	G().then((e) => e.setupMode(Pe));
});
//#endregion
//#region node_modules/monaco-editor/esm/vs/languages/features/html/register.js
var Le = class {
	constructor(e, t, n) {
		this._onDidChange = new l(), this._languageId = e, this.setOptions(t), this.setModeConfiguration(n);
	}
	get onDidChange() {
		return this._onDidChange.event;
	}
	get languageId() {
		return this._languageId;
	}
	get options() {
		return this._options;
	}
	get modeConfiguration() {
		return this._modeConfiguration;
	}
	setOptions(e) {
		this._options = e || /* @__PURE__ */ Object.create(null), this._onDidChange.fire(this);
	}
	setModeConfiguration(e) {
		this._modeConfiguration = e || /* @__PURE__ */ Object.create(null), this._onDidChange.fire(this);
	}
}, K = {
	format: {
		tabSize: 4,
		insertSpaces: !1,
		wrapLineLength: 120,
		unformatted: "default\": \"a, abbr, acronym, b, bdo, big, br, button, cite, code, dfn, em, i, img, input, kbd, label, map, object, q, samp, select, small, span, strong, sub, sup, textarea, tt, var",
		contentUnformatted: "pre",
		indentInnerHtml: !1,
		preserveNewLines: !0,
		maxPreserveNewLines: void 0,
		indentHandlebars: !1,
		endWithNewline: !1,
		extraLiners: "head, body, /html",
		wrapAttributes: "auto"
	},
	suggest: {},
	data: { useDefaultDataProvider: !0 }
};
function q(e) {
	return {
		completionItems: !0,
		hovers: !0,
		documentSymbols: !0,
		links: !0,
		documentHighlights: !0,
		rename: !0,
		colors: !0,
		foldingRanges: !0,
		selectionRanges: !0,
		diagnostics: e === J,
		documentFormattingEdits: e === J,
		documentRangeFormattingEdits: e === J
	};
}
var J = "html", Re = "handlebars", Y = "razor";
X(J, K, q(J)).defaults, X(Re, K, q(Re)).defaults, X(Y, K, q(Y)).defaults;
function ze() {
	return import("./htmlMode-BuU-k5Gz.js");
}
function X(e, t = K, n = q(e)) {
	let r = new Le(e, t, n), i, a = o.onLanguage(e, async () => {
		i = (await ze()).setupMode(r);
	});
	return {
		defaults: r,
		dispose() {
			a.dispose(), i?.dispose(), i = void 0;
		}
	};
}
var Be = new class {
	constructor(e, t, n) {
		this._onDidChange = new l(), this._languageId = e, this.setDiagnosticsOptions(t), this.setModeConfiguration(n);
	}
	get onDidChange() {
		return this._onDidChange.event;
	}
	get languageId() {
		return this._languageId;
	}
	get modeConfiguration() {
		return this._modeConfiguration;
	}
	get diagnosticsOptions() {
		return this._diagnosticsOptions;
	}
	setDiagnosticsOptions(e) {
		this._diagnosticsOptions = e || /* @__PURE__ */ Object.create(null), this._onDidChange.fire(this);
	}
	setModeConfiguration(e) {
		this._modeConfiguration = e || /* @__PURE__ */ Object.create(null), this._onDidChange.fire(this);
	}
}("json", {
	validate: !0,
	allowComments: !0,
	schemas: [],
	enableSchemaRequest: !1,
	schemaRequest: "warning",
	schemaValidation: "warning",
	comments: "error",
	trailingCommas: "error"
}, {
	documentFormattingEdits: !0,
	documentRangeFormattingEdits: !0,
	completionItems: !0,
	hovers: !0,
	documentSymbols: !0,
	tokens: !0,
	colors: !0,
	foldingRanges: !0,
	diagnostics: !0,
	selectionRanges: !0
});
function Ve() {
	return import("./jsonMode-C9IhPd1b.js");
}
o.register({
	id: "json",
	extensions: [
		".json",
		".bowerrc",
		".jshintrc",
		".jscsrc",
		".eslintrc",
		".babelrc",
		".har"
	],
	aliases: ["JSON", "json"],
	mimetypes: ["application/json"]
}), o.onLanguage("json", () => {
	Ve().then((e) => e.setupMode(Be));
});
//#endregion
//#region node_modules/monaco-editor/esm/vs/features/find/register.js
var He = "__monacoFindWidgetTabIndexPatchApplied", Z = "__monacoFindWidgetOriginalTabIndex";
function Ue(e, t) {
	let n = e?._domNode;
	if (!n) return;
	let r = n.querySelectorAll("input, textarea, [tabindex], [role=\"button\"], [role=\"checkbox\"]");
	for (let e of r) if (e instanceof HTMLElement) {
		if (t) {
			if (!(Z in e.dataset)) continue;
			let t = e.dataset[Z];
			t === "" ? e.removeAttribute("tabindex") : e.tabIndex = Number(t), delete e.dataset[Z];
		} else Z in e.dataset || (e.dataset[Z] = e.getAttribute("tabindex") ?? ""), e.tabIndex = -1;
	}
}
if (!u[He]) {
	let e = u.prototype._reveal, t = u.prototype._hide;
	u.prototype._reveal = function(...t) {
		e.apply(this, t), Ue(this, !0);
	}, u.prototype._hide = function(...e) {
		t.apply(this, e), Ue(this, !1);
	}, u[He] = !0;
}
//#endregion
//#region node_modules/monaco-editor/esm/vs/editor/editor.worker.js?worker
function We(e) {
	return new Worker("/studio-ui/assets/editor.worker-CoxK7wpB.js", {
		type: "module",
		name: e?.name
	});
}
//#endregion
//#region node_modules/monaco-editor/esm/vs/languages/features/typescript/ts.worker.js?worker
function Ge(e) {
	return new Worker("/studio-ui/assets/ts.worker-ApoTl-3m.js", {
		type: "module",
		name: e?.name
	});
}
//#endregion
//#region node_modules/monaco-editor/esm/vs/languages/features/json/json.worker.js?worker
function Ke(e) {
	return new Worker("/studio-ui/assets/json.worker-NqY_TxEu.js", {
		type: "module",
		name: e?.name
	});
}
//#endregion
//#region node_modules/monaco-editor/esm/vs/languages/features/css/css.worker.js?worker
function qe(e) {
	return new Worker("/studio-ui/assets/css.worker-fQD24i06.js", {
		type: "module",
		name: e?.name
	});
}
//#endregion
//#region node_modules/monaco-editor/esm/vs/languages/features/html/html.worker.js?worker
function Je(e) {
	return new Worker("/studio-ui/assets/html.worker-DZEeq16I.js", {
		type: "module",
		name: e?.name
	});
}
globalThis.MonacoEnvironment = { getWorker(e, t) {
	return t === "typescript" || t === "javascript" ? new Ge() : t === "json" ? new Ke() : [
		"css",
		"scss",
		"less"
	].includes(t) ? new qe() : [
		"html",
		"handlebars",
		"razor"
	].includes(t) ? new Je() : new We();
} }, d.setCompilerOptions({
	strict: !0,
	target: m.ESNext,
	module: p.ESNext,
	jsx: h.ReactJSX,
	allowNonTsExtensions: !0
}), d.setDiagnosticsOptions({
	noSemanticValidation: !0,
	noSyntaxValidation: !1
}), f.setDiagnosticsOptions({
	noSemanticValidation: !0,
	noSyntaxValidation: !1
}), i.defineTheme("devmethod-code", {
	base: "vs-dark",
	inherit: !0,
	rules: [],
	colors: {
		"editor.background": "#0B1526",
		"editorLineNumber.foreground": "#93A7C9",
		"editorLineNumber.activeForeground": "#F5F7FC",
		"editorGutter.background": "#0B1526"
	}
});
//#endregion
//#region studio-ui/src/features/code/model/language.ts
var Ye = {
	ts: "typescript",
	tsx: "typescript",
	mts: "typescript",
	cts: "typescript",
	js: "javascript",
	jsx: "javascript",
	mjs: "javascript",
	cjs: "javascript",
	css: "css",
	scss: "scss",
	less: "less",
	json: "json",
	jsonc: "json",
	html: "html",
	htm: "html",
	md: "markdown",
	markdown: "markdown"
};
function Q(e) {
	return Ye[e.split(".").at(-1)?.toLowerCase() ?? ""] ?? "plaintext";
}
//#endregion
//#region studio-ui/src/features/code/model/diagnostics.ts
var $ = "devmethod";
function Xe(e) {
	return e.filter((e) => e.owner !== $);
}
//#endregion
//#region studio-ui/src/features/code/hooks/useMonacoEditor.ts
var Ze = 0;
function Qe(e) {
	let t = Math.max(1, e.line ?? 1), n = Math.max(1, e.column ?? 1);
	return {
		severity: e.severity === "error" ? a.Error : e.severity === "warning" ? a.Warning : a.Info,
		message: e.message,
		source: "DevMethod",
		startLineNumber: t,
		startColumn: n,
		endLineNumber: Math.max(t, e.endLine ?? t),
		endColumn: Math.max(n + 1, e.endColumn ?? n + 1)
	};
}
function $e(e) {
	let t = (0, g.useRef)(null), n = (0, g.useRef)(e);
	return (0, g.useLayoutEffect)(() => {
		n.current = e;
	}, [e]), (0, g.useLayoutEffect)(() => {
		if (!t.current) return;
		let e = ++Ze, r = /* @__PURE__ */ new Map(), o = /* @__PURE__ */ new Map(), l = {
			theme: "devmethod-code",
			automaticLayout: !0,
			minimap: { enabled: !1 },
			fontSize: 13,
			lineHeight: 22,
			lineNumbers: "on",
			scrollBeyondLastLine: !1,
			padding: {
				top: 10,
				bottom: 10
			},
			wordWrap: "off",
			tabSize: 2,
			glyphMargin: !0,
			folding: !0,
			renderValidationDecorations: "on",
			ariaLabel: "Code source multicolore",
			accessibilitySupport: "auto",
			editContext: !1
		}, u = i.create(t.current, {
			...l,
			model: null
		}), d = null, f = null, p = !1, m = !1, h = [], g = [];
		function _() {
			h.forEach((e) => e.dispose()), h = [u.onDidChangeModelContent(() => {
				!p && f && n.current.onChange?.(u.getValue());
			}), u.onDidChangeCursorPosition(({ position: e }) => {
				let t = u.getModel();
				t && n.current.onSelection?.({
					line: e.lineNumber,
					column: e.column,
					offset: t.getOffsetAt(e)
				});
			})], u.addCommand(c.CtrlCmd | s.KeyS, () => n.current.onSave?.());
		}
		_();
		function v() {
			for (let [e, t] of r) i.setModelMarkers(t.model, $, g.filter((t) => !t.file || t.file === e).map(Qe));
		}
		function te() {
			let e = f && r.get(f.path);
			e && (e.state = u.saveViewState());
		}
		function y(e) {
			!!d !== e && (h.forEach((e) => e.dispose()), d ? d.dispose() : u.dispose(), e ? (d = i.createDiffEditor(t.current, {
				...l,
				readOnly: !0,
				originalEditable: !1,
				renderSideBySide: !1
			}), u = d.getModifiedEditor()) : (d = null, u = i.create(t.current, {
				...l,
				model: null
			})), _());
		}
		function b() {
			let e = u.getModel();
			e && n.current.onDiagnostics?.(Xe(i.getModelMarkers({ resource: e.uri })).map((e) => ({
				...f ? { file: f.path } : {},
				line: e.startLineNumber,
				column: e.startColumn,
				severity: e.severity === a.Error ? "error" : e.severity === a.Warning ? "warning" : "info",
				message: e.message
			})));
		}
		let x = i.onDidChangeMarkers((e) => {
			let t = u.getModel();
			t && e.some((e) => e.toString() === t.uri.toString()) && b();
		}), S = {
			setDocument(a) {
				if (m) return;
				let s = f?.path !== a.path;
				(s || !!d != (a.original !== void 0)) && te(), y(a.original !== void 0);
				let c = r.get(a.path);
				if (!c) {
					let t = ee.parse(`file:///studio-${e}/${a.path.split("/").map(encodeURIComponent).join("/")}`);
					c = {
						model: i.createModel(a.value, Q(a.path), t),
						state: null
					}, r.set(a.path, c);
				}
				if (f = a, p = !0, c.model.getValue() !== a.value && c.model.setValue(a.value), d && a.original !== void 0) {
					let e = o.get(a.path);
					e ? e.getValue() !== a.original && e.setValue(a.original) : (e = i.createModel(a.original, Q(a.path)), o.set(a.path, e)), d.setModel({
						original: e,
						modified: c.model
					});
				} else u.getModel() !== c.model && u.setModel(c.model);
				u.updateOptions({ readOnly: a.readOnly }), s && c.state && u.restoreViewState(c.state), p = !1, t.current.dataset.language = Q(a.path);
				let l = u.getPosition();
				l && n.current.onSelection?.({
					line: l.lineNumber,
					column: l.column,
					offset: c.model.getOffsetAt(l)
				}), v(), b();
			},
			setDiagnostics(e) {
				g = e, v();
			},
			focus(e) {
				e && (u.setPosition({
					lineNumber: e.line,
					column: e.column ?? 1
				}), u.revealLineInCenter(e.line)), u.focus();
			},
			dispose() {
				if (!m) {
					m = !0, x.dispose(), h.forEach((e) => e.dispose()), d ? d.dispose() : u.dispose();
					for (let e of r.values()) i.setModelMarkers(e.model, $, []), e.model.dispose();
					o.forEach((e) => e.dispose());
				}
			}
		};
		return n.current.onReady(S), () => S.dispose();
	}, []), t;
}
//#endregion
//#region studio-ui/src/features/code/components/CodeEditor.tsx
var et = n();
function tt(e) {
	let t = $e(e);
	return /* @__PURE__ */ (0, et.jsx)("div", {
		className: "monaco-code-surface",
		translate: "no",
		ref: t
	});
}
//#endregion
//#region studio-ui/src/code-widget.tsx
function nt(e, t = {}) {
	return new Promise((n, r) => {
		let i = !1, a = (0, _.createRoot)(e, { onUncaughtError(e) {
			r(e), queueMicrotask(() => a.unmount());
		} });
		a.render(/* @__PURE__ */ (0, et.jsx)(tt, {
			...t,
			onReady: (e) => n({
				...e,
				dispose() {
					i || (i = !0, e.dispose(), a.unmount());
				}
			})
		}));
	});
}
//#endregion
export { nt as mountCodeWidget };
