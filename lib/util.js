
export function normalizeListen(...args) {
	if (args.length === 0) {
		return [0, undefined, undefined];
	} else if (args.length === 1) {
		if (typeof args[0] === 'function') {
			return [0, undefined, args[0]];
		} else if (typeof args[0] === 'number') {
			return [args[0], undefined, undefined];
		} else {
			throw new TypeError();
		}
	} else if (args.length === 2) {
		if (typeof args[1] === 'function') {
			return [args[0], undefined, args[1]];
		} else if (typeof args[1] === 'string') {
			return [args[0], args[1], undefined];
		} else {
			throw new TypeError();
		}
	} else if (args.length === 3) {
		return args;
	} else {
		throw new TypeError();
	}
}
