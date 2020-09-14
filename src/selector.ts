import ArmorCollection from './collection';
import { ArmorCollectionQuery } from './query';

export default class ArmorCollectionSelector<T> {
	public readonly collection: ArmorCollection<T>;

	constructor(collection: ArmorCollection<T>, query?: ArmorCollectionQuery) {
		this.collection = collection;
	}

}
