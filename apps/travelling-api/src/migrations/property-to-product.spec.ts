import {
	archiveMatches,
	resetMemberProductCounters,
	runPropertyToProductMigration,
} from '../../../../scripts/migrations/property-to-product';

const makeDb = (options: { existingRun?: object; products?: number } = {}) => {
	const insertOne = jest.fn();
	const existing = new Set<string>();
	if (options.products !== undefined) existing.add('products');

	const db = {
		listCollections: jest.fn(({ name }: { name: string }) => ({
			hasNext: jest.fn().mockResolvedValue(existing.has(name)),
		})),
		collection: jest.fn((name: string) => {
			if (name === 'migration_runs') {
				return {
					findOne: jest.fn().mockResolvedValue(options.existingRun ?? null),
					insertOne,
				};
			}
			return {
				countDocuments: jest.fn().mockResolvedValue(name === 'products' ? options.products ?? 0 : 0),
			};
		}),
	};
	return { db, insertOne };
};

describe('property-to-product migration safeguards', () => {
	beforeEach(() => jest.spyOn(console, 'log').mockImplementation(() => undefined));
	afterEach(() => jest.restoreAllMocks());

	it('is dry-run only unless apply is explicitly enabled', async () => {
		const { db, insertOne } = makeDb();
		await runPropertyToProductMigration(db as never, false);
		expect(insertOne).not.toHaveBeenCalled();
	});

	it('rejects a non-empty destination products collection', async () => {
		const { db } = makeDb({ products: 1 });
		await expect(runPropertyToProductMigration(db as never, false)).rejects.toThrow(
			'The products collection must be absent or empty',
		);
	});

	it('blocks reruns after a migration marker exists', async () => {
		const { db } = makeDb({ existingRun: { status: 'complete' } });
		await expect(runPropertyToProductMigration(db as never, true)).rejects.toThrow(
			'Migration already started with status: complete',
		);
	});

	it('aborts when an archive copy count does not match its source', async () => {
		const source = {
			countDocuments: jest.fn().mockResolvedValue(2),
			aggregate: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
		};
		const archive = { countDocuments: jest.fn().mockResolvedValue(1) };
		const db = {
			listCollections: jest.fn().mockReturnValue({ hasNext: jest.fn().mockResolvedValue(false) }),
			collection: jest.fn((name: string) => (name === 'likes' ? source : archive)),
		};

		await expect(archiveMatches(db as never, 'likes', { likeGroup: 'PROPERTY' }, 'backup')).rejects.toThrow(
			'Archive verification failed for likes: expected 2, copied 1',
		);
	});

	it('archives old member counters before resetting memberProducts', async () => {
		const existing = new Set(['members']);
		let resetApplied = false;
		const updateMany = jest.fn().mockImplementation(async () => {
			resetApplied = true;
			return { modifiedCount: 3 };
		});
		const members = {
			countDocuments: jest.fn().mockImplementation(async (filter?: Record<string, unknown>) => {
				if (!filter) return 3;
				if ('memberProperties' in filter) return resetApplied ? 0 : 2;
				if ('memberProducts' in filter) return resetApplied ? 3 : 0;
				return 0;
			}),
			aggregate: jest.fn().mockImplementation((pipeline: Array<Record<string, unknown>>) => ({
				toArray: jest.fn().mockImplementation(async () => {
					const output = pipeline.at(-1) as { $out: string };
					existing.add(output.$out);
				}),
			})),
			updateMany,
		};
		const archive = { countDocuments: jest.fn().mockResolvedValue(2) };
		const db = {
			listCollections: jest.fn(({ name }: { name: string }) => ({
				hasNext: jest.fn().mockResolvedValue(existing.has(name)),
			})),
			collection: jest.fn((name: string) => (name === 'members' ? members : archive)),
		};

		await resetMemberProductCounters(db as never, 'stamp');
		expect(updateMany).toHaveBeenCalledWith(
			{},
			{ $unset: { memberProperties: '' }, $set: { memberProducts: 0 } },
		);
		expect(archive.countDocuments).toHaveBeenCalled();
	});
});
