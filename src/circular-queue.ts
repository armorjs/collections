import {ADTBase} from './base';
import {ADTCircularQueueOptions as Options} from './circular-queue/options';
import {ADTQueryFilter as QueryFilter} from './query/filter';
import {ADTQueryOptions as QueryOptions} from './query/options';
import {ADTQueryResult as QueryResult} from './query/result';
import {ADTCircularQueueState as State} from './circular-queue/state';

export class ADTCircularQueue<T> implements ADTBase<T> {
	public state: State<T>;

	constructor(options?: Options<T>) {
		this.state = this.parseOptions(options);
	}

	public parseOptions(options?: Options<T>): State<T> {
		const state = this.parseOptionsState(options);
		const finalState = this.parseOptionsOther(state, options);

		return finalState;
	}

	public parseOptionsState(options?: Options<T>): State<T> {
		const state: State<T> = this.getDefaultState();

		if (!options) {
			return state;
		}

		let parsed: State<T> | Array<string> | null = null;
		let result: State<T> | null = null;

		if (typeof options.serializedState === 'string') {
			parsed = this.parseOptionsStateString(options.serializedState);

			if (Array.isArray(parsed)) {
				throw new Error(parsed.join('\n'));
			}

			result = parsed;
		}

		if (result) {
			state.elements = result.elements;
			state.overwrite = result.overwrite;
			state.maxSize = result.maxSize;
			state.size = result.size;
			state.front = result.front;
			state.rear = result.rear;
		}

		return state;
	}

	public parseOptionsStateString(data: string): State<T> | Array<string> | null {
		if (typeof data !== 'string' || data === '') {
			return null;
		}

		let result: State<T> | Array<string> | null = null;
		let parsed: State<T> | null = null;
		let errors: Array<string> = [];

		try {
			parsed = JSON.parse(data);

			if (parsed) {
				errors = this.getStateErrors(parsed);
			}

			if (errors.length) {
				throw new Error('state is not a valid ADTCircularQueueState');
			}

			result = parsed;
		} catch (error) {
			result = [error.message].concat(errors);
		}

		return result;
	}

	public parseOptionsOther(s: State<T>, options?: Options<T>): State<T> {
		let state: State<T> | null = s;

		if (!s) {
			state = this.getDefaultState();
		}

		if (!options) {
			return state;
		}

		if (options.elements && Array.isArray(options.elements)) {
			state.elements = options.elements.slice();
		}

		if (options.size && this.isInteger(options.size) && options.size >= 0) {
			state.size = options.size;
		}
		if (options.front && this.isInteger(options.front)) {
			state.front = options.front;
		}
		if (options.rear && this.isInteger(options.rear)) {
			state.rear = options.rear;
		}

		if (options.maxSize && this.isInteger(options.maxSize) && options.maxSize >= 1) {
			state.maxSize = options.maxSize;
		}

		return state;
	}

	public getDefaultState(): State<T> {
		const state: State<T> = {
			type: 'CircularQueue',
			elements: [],
			overwrite: false,
			size: 0,
			maxSize: 100,
			front: 0,
			rear: 0
		};

		return state;
	}

	public getStateErrors(state: State<T>): Array<string> {
		const errors: Array<string> = [];

		if (!state) {
			errors.push('state is null or undefined');
			return errors;
		}

		if (state.type !== 'CircularQueue') {
			errors.push('state type must be CircularQueue');
		}
		if (!Array.isArray(state.elements)) {
			errors.push('state elements must be an array');
		}
		if (typeof state.overwrite !== 'boolean') {
			errors.push('state overwrite must be a boolean');
		}

		if (!this.isInteger(state.size) || state.size < 0) {
			errors.push('state size must be an integer >= 0');
		}
		if (!this.isInteger(state.maxSize) || state.maxSize < 1) {
			errors.push('state maxSize must be an integer >= 1');
		}

		if (!this.isInteger(state.front)) {
			errors.push('state front must be an integer');
		}
		if (!this.isInteger(state.rear)) {
			errors.push('state rear must be an integer');
		}

		return errors;
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

	public isValidState(state: State<T>): boolean {
		const errors = this.getStateErrors(state);

		if (errors.length) {
			return false;
		}

		return true;
	}

	public queryDelete(query: QueryResult<T>): T | null {
		if (!query || !query.index) {
			return null;
		}

		let index = query.index();

		if (index === null) {
			return null;
		}

		const front = this.wrapIndex(this.state.front);
		let rear = this.wrapIndex(this.state.rear);

		if (this.size() && rear <= front) {
			rear = rear + this.state.maxSize;
		}

		if (this.size() && index < front) {
			index = index + this.state.maxSize;
		}

		if (index >= rear) {
			delete this.state.elements[this.wrapIndex(index)];
			return query.element;
		}

		this.state.elements.splice(this.wrapIndex(index), 1);
		this.state.size--;
		this.state.rear = this.wrapIndex(this.state.rear - 1);

		return query.element;
	}

	public queryIndex(query: T): number | null {
		let position = -1;

		this.forEach((element, index) => {
			if (position !== -1) {
				return false;
			}
			if (element === query) {
				position = index;
			}
		});

		if (position < 0) {
			return null;
		}

		return position;
	}

	public queryOptions(opts?: QueryOptions): Required<QueryOptions> {
		const options: Required<QueryOptions> = {
			limit: Infinity
		};

		if (opts?.limit && typeof opts.limit === 'number' && opts.limit >= 1) {
			options.limit = Math.round(opts.limit);
		}

		return options;
	}

	public wrapIndex(n: number): number {
		if (!this.isInteger(n)) {
			return -1;
		}

		let index = n;
		while (index < 0) {
			index += this.state.maxSize;
		}

		return index % this.state.maxSize;
	}

	public clearElements(): ADTCircularQueue<T> {
		this.state.elements = [];
		this.state.front = 0;
		this.state.rear = 0;
		this.state.size = 0;

		return this;
	}

	// prettier-ignore
	// eslint-disable-next-line max-len, prettier/prettier
	public filter(func: (element: T, index: number, arr: T[]) => boolean, thisArg?: any): ADTCircularQueue<T> {
		let boundThis = this;
		if (thisArg) {
			boundThis = thisArg;
		}

		const queue = new ADTCircularQueue<T>({
			overwrite: this.state.overwrite,
			maxSize: this.state.maxSize
		});

		this.forEach((elem, idx, arr) => {
			const result = func.call(boundThis, elem, idx, arr);
			if (result) {
				queue.push(elem);
			}
		}, boundThis);

		return queue;
	}

	public forEach(func: (element: T, index: number, arr: T[]) => void, thisArg?: any): ADTCircularQueue<T> {
		const front = this.wrapIndex(this.state.front);
		let rear = this.wrapIndex(this.state.rear);

		if (this.size() && rear <= front) {
			rear = rear + this.state.maxSize;
		}

		let boundThis = this;
		if (thisArg) {
			boundThis = thisArg;
		}

		for (let i = front; i < rear; i++) {
			const iWrap = this.wrapIndex(i);
			func.call(boundThis, this.state.elements[iWrap], iWrap, this.state.elements);
		}

		return this;
	}

	public front(): T | null {
		if (!this.isValidState(this.state)) {
			return null;
		}

		if (!this.size()) {
			return null;
		}

		return this.state.elements[this.state.front];
	}

	public getIndex(n: number): T | null {
		if (!this.isValidState(this.state)) {
			return null;
		}
		if (!this.isInteger(n)) {
			return null;
		}
		if (!this.size()) {
			return null;
		}

		let index = n;
		if (index >= 0) {
			index = this.state.front + index;
		} else {
			index = this.state.rear - 1 + index;
		}

		return this.state.elements[this.wrapIndex(index)];
	}

	public isEmpty(): boolean {
		if (!this.isValidState(this.state)) {
			return false;
		}

		return this.size() === 0;
	}

	public isFull(): boolean {
		if (!this.isValidState(this.state)) {
			return false;
		}

		return this.size() >= this.state.maxSize;
	}

	public pop(): T | null {
		if (!this.isValidState(this.state)) {
			return null;
		}

		if (this.isEmpty()) {
			return null;
		}

		const front = this.front();

		this.state.front = this.wrapIndex(this.state.front + 1);
		this.state.size--;

		return front;
	}

	public push(element: T): boolean {
		if (!this.isValidState(this.state)) {
			return false;
		}

		if (!this.state.overwrite && this.isFull()) {
			return false;
		}

		this.state.elements[this.state.rear] = element;
		this.state.rear = this.wrapIndex(this.state.rear + 1);

		if (this.state.overwrite && this.isFull()) {
			this.state.front = this.wrapIndex(this.state.front + 1);
		} else {
			this.state.size++;
		}

		return true;
	}

	public query(filters: QueryFilter<T> | QueryFilter<T>[], opts?: QueryOptions): QueryResult<T>[] {
		const resultsArray: QueryResult<T>[] = [];
		const options = this.queryOptions(opts);

		this.forEach((element) => {
			let take = false;

			if (resultsArray.length >= options.limit) {
				return false;
			}

			if (Array.isArray(filters)) {
				take =
					!!filters.length &&
					filters.every((filter) => {
						return filter(element);
					});
			} else {
				take = filters(element);
			}

			if (!take) {
				return false;
			}

			const result: QueryResult<T> = {} as QueryResult<T>;
			result.element = element;
			result.key = (): any => null;
			result.index = this.queryIndex.bind(this, element);
			result.delete = this.queryDelete.bind(this, result);
			resultsArray.push(result);
		});

		return resultsArray;
	}

	public rear(): T | null {
		if (!this.isValidState(this.state)) {
			return null;
		}

		if (!this.size()) {
			return null;
		}

		return this.state.elements[this.wrapIndex(this.state.rear - 1)];
	}

	public reset(): ADTCircularQueue<T> {
		this.clearElements();

		this.state.type = 'CircularQueue';

		return this;
	}

	public size(): number {
		if (!this.isValidState(this.state)) {
			return 0;
		}

		return this.state.size;
	}

	public stringify(): string | null {
		if (!this.isValidState(this.state)) {
			return null;
		}

		return JSON.stringify(this.state);
	}
}
