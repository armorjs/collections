import ArmorCollection from './collection';
import ArmorCollectionSelector from './selector';
import ArmorObjectPoolInstance from './object-pool-instance';
import ArmorObjectPoolOptions from './object-pool-options';
import ArmorObjectPoolState from './object-pool-state';

export default class ArmorObjectPool<T> implements ArmorCollection<T> {
	public readonly state: ArmorObjectPoolState<T>;
	public readonly objectClass: ArmorObjectPoolInstance<T>;

	constructor(objectClass: ArmorObjectPoolInstance<T>, options?: ArmorObjectPoolOptions<T>) {
		if (typeof objectClass !== 'function') {
			throw new Error('Must have a class contructor for object pool to operate properly');
		}
		this.objectClass = objectClass;

		this.state = this.parseOptions(options);

		this.increaseCapacity(this.state.startSize);
	}

	public getDefaultState(): ArmorObjectPoolState<T> {
		const state: ArmorObjectPoolState<T> = {
			type: 'opState',
			elements: [],
			autoIncrease: false,
			startSize: 10,
			objectCount: 0,
			maxSize: 1000,
			increaseBreakPoint: 0.8,
			increaseFactor: 2
		};

		return state;
	}

	public parseOptions(options?: ArmorObjectPoolOptions<T>): ArmorObjectPoolState<T> {
		const state = this.parseOptionsState(options);
		const finalState = this.parseOptionsOther(state, options);

		return finalState;
	}

	public parseOptionsState(options?: ArmorObjectPoolOptions<T>): ArmorObjectPoolState<T> {
		const state: ArmorObjectPoolState<T> = this.getDefaultState();

		if (!options) {
			return state;
		}

		let parsed: ArmorObjectPoolState<T> | Array<string> | null = null;
		let result: ArmorObjectPoolState<T> | null = null;

		if (typeof options.serializedState === 'string') {
			parsed = this.parse(options.serializedState);

			if (Array.isArray(parsed)) {
				throw new Error(parsed.join('\n'));
			}

			result = parsed;
		}

		if (result) {
			state.autoIncrease = result.autoIncrease;

			state.startSize = result.objectCount;
			state.maxSize = result.maxSize;

			state.increaseBreakPoint = result.increaseBreakPoint;
			state.increaseFactor = result.increaseFactor;
		}

		return state;
	}

	public parseOptionsOther(s: ArmorObjectPoolState<T>, options?: ArmorObjectPoolOptions<T>): ArmorObjectPoolState<T> {
		let result: ArmorObjectPoolState<T> | null = s;

		if (!s) {
			result = this.getDefaultState();
		}

		if (!options) {
			return result;
		}

		if (options.startSize && this.isInteger(options.startSize) && options.startSize >= 0) {
			result.startSize = options.startSize;
		}
		if (options.maxSize && this.isInteger(options.maxSize) && options.maxSize >= 1) {
			result.maxSize = options.maxSize;
		}

		if (options.increaseBreakPoint) {
			const between0and1 = options.increaseBreakPoint >= 0 && options.increaseBreakPoint <= 1;
			if (this.isFloat(options.increaseBreakPoint) && between0and1) {
				result.increaseBreakPoint = options.increaseBreakPoint;
			}
		}
		if (options.increaseFactor && this.isFloat(options.increaseFactor) && options.increaseFactor >= 0) {
			result.increaseFactor = options.increaseFactor;
		}

		return result;
	}

	public utilization(allocationsPending: number = 0): number {
		if (!this.isValidState(this.state)) {
			return NaN;
		}
		if (this.state.objectCount === 0) {
			return Infinity;
		}

		let num: number = allocationsPending;
		if (typeof num !== 'number' || isNaN(num)) {
			num = 0;
		}

		const freeObj = this.state.elements.length - num;
		return (this.state.objectCount - freeObj) / this.state.objectCount;
	}

	public isAboveThreshold(allocationsPending: number = 0): boolean {
		return this.utilization(allocationsPending) >= this.state.increaseBreakPoint;
	}

	public allocate(): T | null {
		if (!this.isValidState(this.state)) {
			return null;
		}

		if (this.state.autoIncrease && this.isAboveThreshold(1)) {
			this.increaseCapacity(Math.ceil(this.state.objectCount * this.state.increaseFactor));
		}

		let result = this.state.elements.pop();

		if (result === undefined) {
			return null;
		}

		return result;
	}

	public allocateMultiple(n: number = 1): Array<T> {
		let num: number;
		if (!this.isInteger(n) || n < 1) {
			num = 1;
		} else {
			num = n;
		}

		let result: Array<T> = [];

		for (let i = 0; i < num && this.state.elements.length; i++) {
			const item = this.allocate();
			if (item !== null) {
				result.push(item);
			}
		}

		return result;
	}

	public increaseCapacity(n: number): void {
		if (!this.isValidState(this.state)) {
			return;
		}
		if (!this.isInteger(n)) {
			return;
		}

		for (let i = 0; i < n && this.state.objectCount < this.state.maxSize; i++) {
			this.store(new this.objectClass());
			this.state.objectCount++;
		}
	}

	public release(object: T): void {
		if (!this.objectClass || !this.objectClass.cleanObj) {
			return;
		}

		this.objectClass.cleanObj(object);
		this.store(object);
	}

	public store(object: T): void {
		if (!this.isValidState(this.state)) {
			return;
		}

		this.state.elements.push(object);
	}

	public isInteger(n: number): boolean {
		if (typeof n !== 'number') {
			return false;
		}
		if (n % 1 !== 0) {
			return false;
		}

		return true;
	}

	public isFloat(n: number): boolean {
		if (typeof n !== 'number') {
			return false;
		}
		if (isNaN(n)) {
			return false;
		}

		return true;
	}

	public isValidState(state: ArmorObjectPoolState<T>): boolean {
		const errors = this.getStateErrors(state);

		if (errors.length) {
			return false;
		}

		return true;
	}

	public getStateErrors(state: ArmorObjectPoolState<T>): Array<string> {
		const errors: Array<string> = [];

		if (!state) {
			errors.push('state is null or undefined');
			return errors;
		}

		if (state.type !== 'opState') {
			errors.push('state type must be opState');
		}
		if (!Array.isArray(state.elements)) {
			errors.push('state elements must be an array');
		}

		if (typeof state.autoIncrease !== 'boolean') {
			errors.push('state autoIncrease must be a boolean');
		}

		if (!this.isInteger(state.startSize) || state.startSize < 0) {
			errors.push('state startSize must be an integer >= 0');
		}
		if (!this.isInteger(state.objectCount) || state.objectCount < 0) {
			errors.push('state objectCount must be an integer >= 0');
		}
		if (!this.isInteger(state.maxSize) || state.maxSize < 1) {
			errors.push('state maxSize must be an integer >= 1');
		}

		const between0and1 = state.increaseBreakPoint >= 0 && state.increaseBreakPoint <= 1;
		if (!this.isFloat(state.increaseBreakPoint) || !between0and1) {
			errors.push('state increaseBreakPoint must be a number between 0 and 1');
		}
		if (!this.isFloat(state.increaseFactor) || state.increaseFactor < 0) {
			errors.push('state increaseFactor must be a positive number');
		}

		return errors;
	}

	public parse(data: string): ArmorObjectPoolState<T> | Array<string> | null {
		if (typeof data !== 'string' || data === '') {
			return null;
		}

		let result: ArmorObjectPoolState<T> | Array<string> | null = null;
		let parsed: ArmorObjectPoolState<T> | null = null;
		let errors: Array<string> = [];

		try {
			parsed = JSON.parse(data);

			if (parsed) {
				errors = this.getStateErrors(parsed);
			}

			if (errors.length) {
				throw new Error('state is not a valid ArmorObjectPoolState');
			}

			result = parsed;
		} catch (error) {
			result = [error.message].concat(errors);
		}

		return result;
	}

	public stringify(): string | null {
		if (!this.isValidState(this.state)) {
			return null;
		}

		return JSON.stringify(this.state).replace(/"elements":\[.*?\]/, '"elements":[]');
	}

	public clearElements(): ArmorObjectPool<T> {
		this.state.elements = [];
		this.state.objectCount = 0;

		return this;
	}

	public reset(): ArmorObjectPool<T> {
		this.clearElements();

		this.state.type = 'opState';
		this.state.autoIncrease = false;
		this.state.increaseFactor = 2;
		this.state.increaseBreakPoint = 0.8;

		this.increaseCapacity(this.state.startSize);

		return this;
	}

	public select(): ArmorCollectionSelector<T> {
		const selector = new ArmorCollectionSelector<T>(this);

		return selector;
	}
}
