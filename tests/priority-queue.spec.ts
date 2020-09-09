import ArmorPriorityQueue from '../src/priority-queue';
import ArmorPriorityQueueComparator from '../src/priority-queue-comparator';
import {type} from 'os';

/**
 * constructor: test if comparator missing
 */

describe('ArmorPriorityQueue', () => {
	let instance: ArmorPriorityQueue<number>;
	const items = [90, 70, 50, 30, 10, 80, 60, 40, 20];
	/**
	 * instance.elements is
	 * [10, 20, 60, 30, 50, 80, 70, 90, 40]
	 * after initialization
	 */

	const comparator: ArmorPriorityQueueComparator<number> = function (a, b) {
		if (typeof a !== 'number') {
			return false;
		}
		if (typeof b !== 'number') {
			return false;
		}

		return a < b;
	};

	beforeAll(() => {
		instance = new ArmorPriorityQueue<number>(comparator);
	});

	beforeEach(() => {
		instance.clear();
	});

	describe('constructor', () => {
		it('should initialize empty priority queue when no arguments are given', () => {
			const custom = new ArmorPriorityQueue<number>(comparator);
			expect(custom.size()).toBe(0);
		});

		it('should initialize priority queue with arguments.elements using comparator', () => {
			const expected = items.slice().sort((a, b) => a - b);
			const custom = new ArmorPriorityQueue<number>(comparator, {elements: items});

			for (let i = 0; i < items.length; i++) {
				const result = custom.pop();
				expect(result).not.toBeNull();
				if (result) expect(result).toBe(expected[i]);
			}
		});
	});

	describe('parseOptions', () => {
		it('should throw if options.elements is include and not an array', () => {
			const datatypes = [44091, '44091', false];
			datatypes.forEach((data) => {
				expect(() => {
					instance.parseOptions({elements: data as any});
				}).toThrow();
			});
			const spy = jest.spyOn(instance, 'push');
			spy.mockClear();
			expect(() => {
				instance.parseOptions({elements: [4, 5, 6] as any});
			}).not.toThrow();
			expect(spy).toBeCalledTimes(3);
		});
	});

	describe('size', () => {
		it('should return 0 when priority queue is empty', () => {
			expect(instance.size()).toBe(0);
		});

		it('should return 0 if elements are missing', () => {
			delete instance.elements;
			expect(instance.size()).toBe(0);
		});

		it('should return the number of items in priority queue', () => {
			const limit = 5;

			for (let i = 0; i < limit; i++) {
				instance.push(Math.floor(Math.random() * 99999));
				expect(instance.size()).toBe(i + 1);
			}
		});
	});

	describe('front', () => {
		it('should return null when priority queue size is 0', () => {
			expect(instance.size()).toBe(0);
			expect(instance.front()).toBeNull();
		});

		it('should return the item with the lowest rank in priority queue', () => {
			items.forEach((item) => {
				instance.push(item);
			});
			const expected = items.slice().sort((a, b) => a - b)[0];
			expect(instance.front()).toStrictEqual(expected);
		});
	});

	describe('swapNodes', () => {
		let unchanged: ArmorPriorityQueue<number>;

		beforeAll(() => {
			unchanged = new ArmorPriorityQueue<number>(comparator);
		});

		beforeEach(() => {
			unchanged.clear();
		});

		const params = [
			{name: 'null', value: null},
			{name: 'below zero', value: -1},
			{name: 'past end', value: 999},
			{name: 'float', value: Math.PI},
			{name: 'in array', value: 0}
		];

		params.forEach((param1) => {
			params.forEach((param2) => {
				if (param1.name === 'in array' && param2.name === 'in array') {
					return false;
				}
				it(`should do nothing if indexOne is ${param1.name} and indexTwo is ${param2.name}`, () => {
					items.forEach((item) => {
						instance.push(item);
						unchanged.push(item);
					});
					instance.swapNodes(param1.value, param2.value);
					expect(instance.elements).toStrictEqual(unchanged.elements);
				});
			});
		});

		it('should swap the order of the items properly', () => {
			items.forEach((item) => {
				instance.push(item);
			});
			/**
			 * start: 10, 20, 60, 30, 50, 80, 70, 90, 40
			 * swap1: 10, 20, 60, 70, 50, 80, 30, 90, 40
			 * swap2: 10, 70, 60, 20, 50, 80, 30, 90, 40
			 */
			expect(instance.elements).toStrictEqual([10, 20, 60, 30, 50, 80, 70, 90, 40]);
			instance.swapNodes(3, 6);
			expect(instance.elements).toStrictEqual([10, 20, 60, 70, 50, 80, 30, 90, 40]);
			instance.swapNodes(1, 3);
			expect(instance.elements).toStrictEqual([10, 70, 60, 20, 50, 80, 30, 90, 40]);
		});

		it('should move all properties of indexOne to indexTwo and vice-versa', () => {
			const complexitems = [{depth1: {depth2: 10}}, {depth1: {depth2: 20}}, {depth1: {depth2: 99}}];

			const deepSwapped = new ArmorPriorityQueue<any>((a, b) => false, {elements: complexitems});
			const deepUnchanged = new ArmorPriorityQueue<any>((a, b) => false, {elements: complexitems});

			deepSwapped.swapNodes(0, 1);
			expect(deepSwapped.elements[0]).toStrictEqual(deepUnchanged.elements[1]);
			expect(deepSwapped.elements[1]).toStrictEqual(deepUnchanged.elements[0]);
			expect(deepSwapped[0] === deepUnchanged[1]).toBeTruthy();
			expect(deepSwapped[1] === deepUnchanged[0]).toBeTruthy();
			deepSwapped.swapNodes(1, 2);
			expect(deepSwapped.elements[2]).toStrictEqual(deepUnchanged.elements[0]);
			expect(deepSwapped.elements[1]).toStrictEqual(deepUnchanged.elements[2]);
			expect(deepSwapped[2] === deepUnchanged[0]).toBeTruthy();
			expect(deepSwapped[1] === deepUnchanged[2]).toBeTruthy();
		});
	});

	describe('getParentNodeIndex', () => {
		beforeEach(() => {
			items.forEach((item) => {
				instance.push(item);
			});
		});
		it('should return null if null is passed', () => {
			expect(instance.getParentNodeIndex(null)).toBeNull();
		});

		it('should return null if 0 or less is passed', () => {
			expect(instance.getParentNodeIndex(0)).toBeNull();
			expect(instance.getParentNodeIndex(-1)).toBeNull();
		});

		it('should return null if a float is passed', () => {
			expect(instance.getParentNodeIndex(Math.PI)).toBeNull();
		});

		it('should return null if the index pass is outside the aray', () => {
			expect(instance.getParentNodeIndex(99)).toBeNull();
		});

		it('should return null if the result would be outside the array', () => {
			expect(instance.getParentNodeIndex(99)).toBeNull();
		});

		it('should return the parent of a valid node if the parent is valid', () => {
			expect(instance.getParentNodeIndex(0)).toBeNull();
			expect(instance.getParentNodeIndex(1)).toBe(0);
			expect(instance.getParentNodeIndex(2)).toBe(0);
			expect(instance.getParentNodeIndex(3)).toBe(1);
			expect(instance.getParentNodeIndex(4)).toBe(1);
			expect(instance.getParentNodeIndex(5)).toBe(2);
			expect(instance.getParentNodeIndex(6)).toBe(2);
			expect(instance.getParentNodeIndex(7)).toBe(3);
		});
	});

	describe('getChildNodesIndexes', () => {
		beforeEach(() => {
			items.forEach((item) => {
				instance.push(item);
			});
		});
		it('should return {left: null, right: null} if null is passed', () => {
			expect(instance.getChildNodesIndexes(null)).toStrictEqual({left: null, right: null});
		});

		it('should return {left: null, right: null} if a negative number is passed', () => {
			expect(instance.getChildNodesIndexes(-1)).toStrictEqual({left: null, right: null});
		});

		it('should return {left: null, right: null} if a float is paseed', () => {
			expect(instance.getChildNodesIndexes(Math.PI)).toStrictEqual({left: null, right: null});
		});

		it('should return {left: null, right: null} if the index passed is outside the aray', () => {
			expect(instance.getChildNodesIndexes(99)).toStrictEqual({left: null, right: null});
		});

		it('should return {left: null, right: null} if the result would be outside the array', () => {
			expect(instance.getChildNodesIndexes(8)).toStrictEqual({left: null, right: null});
		});

		it('should return the children of a valid node in the form of {left: number | null, right: number | null}', () => {
			expect(instance.getChildNodesIndexes(0)).toStrictEqual({left: 1, right: 2});
			expect(instance.getChildNodesIndexes(1)).toStrictEqual({left: 3, right: 4});
			expect(instance.getChildNodesIndexes(2)).toStrictEqual({left: 5, right: 6});
			expect(instance.getChildNodesIndexes(3)).toStrictEqual({left: 7, right: 8});
			expect(instance.getChildNodesIndexes(4)).toStrictEqual({left: null, right: null});
			expect(instance.getChildNodesIndexes(5)).toStrictEqual({left: null, right: null});
			expect(instance.getChildNodesIndexes(6)).toStrictEqual({left: null, right: null});
			expect(instance.getChildNodesIndexes(7)).toStrictEqual({left: null, right: null});
			expect(instance.getChildNodesIndexes(8)).toStrictEqual({left: null, right: null});
		});
	});

	describe('getNextIndex', () => {
		beforeEach(() => {
			items.forEach((item) => {
				instance.push(item);
			});
		});

		it('should call getParentNodeIndex and not call getChildNodesIndexes if startFromTop is false', () => {
			const spyGPNI = jest.spyOn(instance, 'getParentNodeIndex');
			const spyGCNI = jest.spyOn(instance, 'getChildNodesIndexes');
			spyGPNI.mockClear();
			spyGCNI.mockClear();
			instance.getNextIndex(false, 1);
			expect(spyGPNI).toBeCalledTimes(1);
			expect(spyGCNI).toBeCalledTimes(0);
		});

		it('should call getChildNodesIndexes and not call getParentNodeIndex if startFromTop is true', () => {
			const spyGPNI = jest.spyOn(instance, 'getParentNodeIndex');
			const spyGCNI = jest.spyOn(instance, 'getChildNodesIndexes');
			spyGPNI.mockClear();
			spyGCNI.mockClear();
			instance.getNextIndex(true, 1);
			expect(spyGPNI).toBeCalledTimes(0);
			expect(spyGCNI).toBeCalledTimes(1);
		});

		it('should return null if both child indexes are null', () => {
			expect(instance.getNextIndex(true, 8)).toBe(null);
		});

		it('should return leftIndex if rightIndex is null', () => {
			instance.push(100);
			expect(instance.getNextIndex(true, 4)).toBe(9);
		});

		it('should return leftIndex if elements[rightIndex] is null', () => {
			instance.elements[2] = null!;
			expect(instance.getNextIndex(true, 0)).toBe(1);
		});

		it('should return rightIndex if elements[leftIndex] is null', () => {
			instance.elements[1] = null!;
			expect(instance.getNextIndex(true, 0)).toBe(2);
		});

		it('should return leftIndex if elements[leftIndex] < elements[rightIndex]', () => {
			instance.elements[1] = 10;
			instance.elements[2] = 20;
			expect(instance.getNextIndex(true, 0)).toBe(1);
		});

		it('should return rightIndex if elements[leftIndex] > elements[rightIndex]', () => {
			instance.elements[1] = 20;
			instance.elements[2] = 10;
			expect(instance.getNextIndex(true, 0)).toBe(2);
		});
	});

	describe('isHeapUnbalanced', () => {
		beforeEach(() => {
			items.forEach((item) => {
				instance.push(item);
			});
			instance.push(1);
		});

		it('should return false if either parameter is not a number', () => {
			expect(instance.isHeapUnbalanced(null, null)).toBe(false);
			expect(instance.isHeapUnbalanced(null, 0)).toBe(false);
			expect(instance.isHeapUnbalanced(0, null)).toBe(false);
		});

		it('should return false if either node is null', () => {
			instance.elements[0] = null!;
			expect(instance.isHeapUnbalanced(0, 1)).toBe(false);
			instance.elements[0] = 10;
			instance.elements[1] = null!;
			expect(instance.isHeapUnbalanced(0, 1)).toBe(false);
			instance.elements[0] = null!;
			expect(instance.isHeapUnbalanced(0, 1)).toBe(false);
		});

		it('should use the proper parameter order decided by startFromTop', () => {
			const spy = jest.spyOn(instance, 'comparator');
			spy.mockClear();
			instance.isHeapUnbalanced(0, 1);
			expect(spy).toBeCalledWith(10, 1);
			spy.mockClear();
			instance.isHeapUnbalanced(1, 0);
			expect(spy).toBeCalledWith(10, 1);
		});
	});

	describe('fixHeap', () => {
		it('should do 0 swapNodes calls if size is 0 or 1', () => {
			const spy = jest.spyOn(instance, 'swapNodes');
			expect(instance.size()).toBe(0);
			instance.fixHeap(0);
			instance.fixHeap(null);
			instance.fixHeap(1);
			instance.fixHeap(-1);
			expect(spy).not.toBeCalled();
		});

		const datatypes = [null, -1, -99, items.length * 2, Math.PI];

		it('should do 0 swapNodes calls if and invalid type is passed', () => {
			const spy = jest.spyOn(instance, 'swapNodes');
			expect(instance.size()).toBe(0);
			datatypes.forEach((type) => {
				instance.fixHeap(type);
				expect(spy).not.toBeCalled();
			});

			items.forEach((item) => {
				instance.push(item);
			});

			datatypes.forEach((type) => {
				spy.mockClear();
				expect(instance.size()).toBe(items.length);
				instance.fixHeap(type);
				expect(spy).not.toBeCalled();
			});
		});

		it('should do 0 swapNodes calls if the number passed is not the node that made heap invalid', () => {
			const spy = jest.spyOn(instance, 'swapNodes');

			items.forEach((item) => {
				instance.push(item);
			});
			spy.mockClear();

			expect(instance.size()).toBe(items.length);
			instance.elements[instance.size()] = 1;
			instance.elements[0] = 50;

			instance.fixHeap(4);
			expect(spy).not.toBeCalled();
			instance.elements[0] = 10;
		});

		it('should do # swapNodes calls and be in heap order after adding new lowest rank to end', () => {
			const spy = jest.spyOn(instance, 'swapNodes');

			items.forEach((item) => {
				instance.push(item);
			});
			spy.mockClear();

			expect(instance.size()).toBe(items.length);
			instance.elements[instance.size()] = 1;
			// [10, 20, 60, 30, 50, 80, 70, 90, 40, 1] --> [1, 10, 60, 30, 20, 80, 70, 90, 40, 50]
			// 3 swapNode calls to fix
			instance.fixHeap(instance.size() - 1);
			expect(spy).toBeCalledTimes(3);
			expect(instance.elements).toStrictEqual([1, 10, 60, 30, 20, 80, 70, 90, 40, 50]);
		});

		it('should do # swapNodes calls and be in heap order after adding middle value rank to end', () => {
			const spy = jest.spyOn(instance, 'swapNodes');

			items.forEach((item) => {
				instance.push(item);
			});
			spy.mockClear();

			expect(instance.size()).toBe(items.length);
			instance.elements[instance.size()] = 45;
			// [10, 20, 60, 30, 50, 80, 70, 90, 40, 45] --> [10, 20, 60, 30, 45, 80, 70, 90, 40, 50]
			// 1 swapNode calls to fix
			instance.fixHeap(instance.size() - 1);
			expect(spy).toBeCalledTimes(1);
			expect(instance.elements).toStrictEqual([10, 20, 60, 30, 45, 80, 70, 90, 40, 50]);
		});

		it('should do # swapNodes calls and be in heap order after adding new highest rank to end', () => {
			const spy = jest.spyOn(instance, 'swapNodes');

			items.forEach((item) => {
				instance.push(item);
			});
			spy.mockClear();

			expect(instance.size()).toBe(items.length);
			instance.elements[instance.size()] = 100;
			// [10, 20, 60, 30, 50, 80, 70, 90, 40, 100] --> [10, 20, 60, 30, 50, 80, 70, 90, 40, 100]
			// 0 swapNode calls to fix
			instance.fixHeap(instance.size() - 1);
			expect(spy).toBeCalledTimes(0);
			expect(instance.elements).toStrictEqual([10, 20, 60, 30, 50, 80, 70, 90, 40, 100]);
		});

		it('should do # swapNodes calls and be in heap order after adding new lowest rank to beginning', () => {
			const spy = jest.spyOn(instance, 'swapNodes');

			items.forEach((item) => {
				instance.push(item);
			});
			spy.mockClear();

			expect(instance.size()).toBe(items.length);
			instance.elements[0] = 1;
			// [1, 20, 60, 30, 50, 80, 70, 90, 40] --> [1, 20, 60, 30, 50, 80, 70, 90, 40]
			// 0 swapNode calls to fix
			instance.fixHeap(0);
			expect(spy).toBeCalledTimes(0);
			expect(instance.elements).toStrictEqual([1, 20, 60, 30, 50, 80, 70, 90, 40]);
		});

		it('should do # swapNodes calls and be in heap order after adding middle value rank to beginning', () => {
			const spy = jest.spyOn(instance, 'swapNodes');

			items.forEach((item) => {
				instance.push(item);
			});
			spy.mockClear();

			expect(instance.size()).toBe(items.length);
			instance.elements[0] = 35;
			// [55, 20, 60, 30, 50, 80, 70, 90, 40] --> [20, 30, 60, 40, 50, 80, 70, 90, 55]
			// 2 swapNode calls to fix
			instance.fixHeap(0);
			expect(spy).toBeCalledTimes(2);
			expect(instance.elements).toStrictEqual([20, 30, 60, 35, 50, 80, 70, 90, 40]);
		});

		it('should do # swapNodes calls and be in heap order after adding new highest rank to beginning', () => {
			const spy = jest.spyOn(instance, 'swapNodes');

			items.forEach((item) => {
				instance.push(item);
			});
			spy.mockClear();

			expect(instance.size()).toBe(items.length);
			instance.elements[0] = 99;
			// [99, 20, 60, 30, 50, 80, 70, 90, 40] --> [20, 30, 60, 40, 50, 80, 70, 90, 99]
			// 3 swapNode calls to fix
			instance.fixHeap(0);
			expect(spy).toBeCalledTimes(3);
			expect(instance.elements).toStrictEqual([20, 30, 60, 40, 50, 80, 70, 90, 99]);
		});
	});

	describe('push', () => {
		it('should add exactly one item to priority queue when push is called once', () => {
			expect(instance.size()).toBe(0);
			instance.push(1);
			expect(instance.size()).toBe(1);
		});

		it('should add exactly 15 items to priority queue when push is called 15 times', () => {
			expect(instance.size()).toBe(0);

			const limit = 15;
			for (let i = 0; i < limit; i++) {
				instance.push(Math.floor(Math.random() * 999));
			}

			expect(instance.size()).toBe(limit);
		});
	});

	describe('pop', () => {
		it('should remove exactly 1 item from the priority queue when pop is called once', () => {
			const limit = 12;
			for (let i = 0; i < limit; i++) {
				instance.push(Math.floor(Math.random() * 999));
			}
			expect(instance.size()).toBe(limit);
			instance.pop();
			expect(instance.size()).toBe(limit - 1);
		});

		it('should return null when called on a priority queue of size 0', () => {
			expect(instance.size()).toBe(0);
			expect(instance.pop()).toBeNull();
		});

		it('should return null when called repeatedly on a priority queue of size 0', () => {
			expect(instance.size()).toBe(0);

			for (let i = 0; i < 5; i++) {
				expect(instance.pop()).toBeNull();
			}
		});

		it('should return first item in priority queue', () => {
			const limit = 15;
			let expectedResult = 99999;

			for (let i = 0; i < limit; i++) {
				let random = Math.floor(Math.random() * 999);
				if (random < expectedResult) expectedResult = random;
				instance.push(random);
			}

			let result = instance.pop();
			expect(result).not.toBeNull();
			if (result) expect(result).toBe(expectedResult);
		});

		it('should pop items in rank order from priority queue', () => {
			const limit = 15;
			let expectedResults: Array<number> = [];

			for (let i = 0; i < limit; i++) {
				let random = Math.floor(Math.random() * 999);
				expectedResults.push(random);
				instance.push(random);
			}

			expectedResults.sort((a, b) => a - b);

			for (let i = 0; i < limit; i++) {
				let result = instance.pop();
				expect(result).not.toBeNull();
				if (result) expect(result).toBe(expectedResults[i]);
			}
		});
	});

	describe('clear', () => {
		it('should not throw when priority queue is empty', () => {
			expect(instance.size()).toBe(0);
			expect(() => {
				instance.clear();
			}).not.toThrow();
		});

		it('should remove all items from priority queue', () => {
			expect(instance.size()).toBe(0);

			for (let i = 0; i < 5; i++) {
				instance.push(Math.floor(Math.random() * 999));
			}

			instance.clear();
			expect(instance.size()).toBe(0);
		});
	});
});
