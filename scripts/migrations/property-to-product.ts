import 'dotenv/config';
import mongoose from 'mongoose';
import type { Db, Document, Filter } from 'mongodb';

export const MIGRATION_NAME = 'property-to-product';
export const LEGACY_GROUP = 'PROPERTY';

export const relatedCollections: Array<{ source: string; filter: Filter<Document>; archiveLabel: string }> = [
	{ source: 'likes', filter: { likeGroup: LEGACY_GROUP }, archiveLabel: 'likes' },
	{ source: 'views', filter: { viewGroup: LEGACY_GROUP }, archiveLabel: 'views' },
	{ source: 'comments', filter: { commentGroup: LEGACY_GROUP }, archiveLabel: 'comments' },
	{
		source: 'notifications',
		filter: { $or: [{ notificationGroup: LEGACY_GROUP }, { propertyId: { $exists: true } }] },
		archiveLabel: 'notifications',
	},
];

const collectionExists = async (db: Db, name: string): Promise<boolean> => {
	return db.listCollections({ name }, { nameOnly: true }).hasNext();
};

export const archiveMatches = async (
	db: Db,
	sourceName: string,
	filter: Filter<Document>,
	archiveName: string,
	project?: Document,
): Promise<number> => {
	const source = db.collection(sourceName);
	const expected = await source.countDocuments(filter);
	if (!expected) return 0;
	if (await collectionExists(db, archiveName)) throw new Error(`Archive collection already exists: ${archiveName}`);

	const pipeline: Document[] = [{ $match: filter }];
	if (project) pipeline.push({ $project: project });
	pipeline.push({ $out: archiveName });
	await source.aggregate(pipeline).toArray();
	const archived = await db.collection(archiveName).countDocuments();
	if (archived !== expected) {
		throw new Error(`Archive verification failed for ${sourceName}: expected ${expected}, copied ${archived}`);
	}
	return archived;
};

export const resetMemberProductCounters = async (db: Db, stamp: string): Promise<void> => {
	if (!(await collectionExists(db, 'members'))) {
		console.log('[members] skipped; collection does not exist');
		return;
	}

	const members = db.collection('members');
	const memberArchive = `legacy_property_member_counters_${stamp}`;
	console.log('[members] before:', {
		total: await members.countDocuments(),
		legacyCounters: await members.countDocuments({ memberProperties: { $exists: true } }),
		memberArchive,
	});
	const archivedCounters = await archiveMatches(
		db,
		'members',
		{ memberProperties: { $exists: true } },
		memberArchive,
		{ _id: 1, memberProperties: 1 },
	);
	const update = archivedCounters
		? { $unset: { memberProperties: '' }, $set: { memberProducts: 0 } }
		: { $set: { memberProducts: 0 } };
	const modifiedMembers = (await members.updateMany({}, update)).modifiedCount;
	console.log('[members] after:', {
		archivedCounters,
		modifiedMembers,
		legacyCounters: await members.countDocuments({ memberProperties: { $exists: true } }),
		productCounters: await members.countDocuments({ memberProducts: 0 }),
	});
};

const ensureGroupedUniqueIndex = async (
	db: Db,
	collectionName: string,
	refField: string,
	groupField: string,
): Promise<void> => {
	if (!(await collectionExists(db, collectionName))) {
		console.log(`[index:${collectionName}] skipped; collection does not exist`);
		return;
	}

	const collection = db.collection(collectionName);
	const indexes = await collection.indexes();
	const newName = `member_${refField}_${groupField}_unique`;
	console.log(`[index:${collectionName}] before:`, indexes.map((index) => index.name));
	await collection.createIndex(
		{ memberId: 1, [refField]: 1, [groupField]: 1 },
		{ unique: true, name: newName },
	);

	for (const index of indexes) {
		const keys = Object.keys(index.key);
		const isLegacyIndex =
			index.unique === true &&
			keys.length === 2 &&
			index.key.memberId === 1 &&
			index.key[refField] === 1;
		if (isLegacyIndex && index.name) await collection.dropIndex(index.name);
	}
	console.log(`[index:${collectionName}] after:`, (await collection.indexes()).map((index) => index.name));
};

export const collectMigrationCounts = async (db: Db): Promise<Record<string, number>> => {
	const counts: Record<string, number> = {};
	counts.products = (await collectionExists(db, 'products')) ? await db.collection('products').countDocuments() : 0;
	counts.properties = (await collectionExists(db, 'properties')) ? await db.collection('properties').countDocuments() : 0;
	for (const item of relatedCollections) {
		counts[item.archiveLabel] = (await collectionExists(db, item.source))
			? await db.collection(item.source).countDocuments(item.filter)
			: 0;
	}
	counts.memberCounters = (await collectionExists(db, 'members'))
		? await db.collection('members').countDocuments({ memberProperties: { $exists: true } })
		: 0;
	return counts;
};

export const runPropertyToProductMigration = async (db: Db, apply: boolean): Promise<void> => {
	const markers = db.collection('migration_runs');
	const existingRun = await markers.findOne({ name: MIGRATION_NAME });
	if (existingRun) throw new Error(`Migration already started with status: ${existingRun.status}`);

	const counts = await collectMigrationCounts(db);
	console.log('Migration counts:', counts);
	if (counts.products > 0) throw new Error('The products collection must be absent or empty');
	if (!apply) {
		console.log('Dry run complete. Re-run with --apply after reviewing the counts and taking a database backup.');
		return;
	}

	const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
	await markers.insertOne({ name: MIGRATION_NAME, status: 'running', stamp, startedAt: new Date(), counts });

	for (const item of relatedCollections) {
		if (!(await collectionExists(db, item.source))) {
			console.log(`[archive:${item.source}] skipped; collection does not exist`);
			continue;
		}
		const archiveName = `legacy_property_${item.archiveLabel}_${stamp}`;
		const before = await db.collection(item.source).countDocuments(item.filter);
		console.log(`[archive:${item.source}] before:`, { matching: before, archiveName });
		const archived = await archiveMatches(db, item.source, item.filter, archiveName);
		const removed = archived ? (await db.collection(item.source).deleteMany(item.filter)).deletedCount : 0;
		const remaining = await db.collection(item.source).countDocuments(item.filter);
		console.log(`[archive:${item.source}] after:`, { archived, removed, remaining });
		if (removed !== archived || remaining !== 0) {
			throw new Error(`Live cleanup verification failed for ${item.source}`);
		}
	}

	await ensureGroupedUniqueIndex(db, 'likes', 'likeRefId', 'likeGroup');
	await ensureGroupedUniqueIndex(db, 'views', 'viewRefId', 'viewGroup');

	await resetMemberProductCounters(db, stamp);

	if (await collectionExists(db, 'properties')) {
		const archiveName = `legacy_properties_${stamp}`;
		const before = await db.collection('properties').countDocuments();
		console.log('[catalog] before:', { properties: before, archiveName });
		await db.collection('properties').rename(archiveName, { dropTarget: false });
		console.log('[catalog] after:', {
			propertiesExists: await collectionExists(db, 'properties'),
			archived: await db.collection(archiveName).countDocuments(),
		});
	} else {
		console.log('[catalog] skipped; properties collection does not exist');
	}

	await markers.updateOne(
		{ name: MIGRATION_NAME, stamp },
		{ $set: { status: 'complete', completedAt: new Date() } },
	);
	console.log('Final live counts:', await collectMigrationCounts(db));
	console.log(`Migration complete. Legacy archives use suffix ${stamp}.`);
};

const main = async (): Promise<void> => {
	const apply = process.argv.includes('--apply');
	const uri =
		process.env.MONGO_MIGRATION_URI ??
		(process.env.NODE_ENV === 'production' ? process.env.MONGO_PROD : process.env.MONGO_DEV);
	if (!uri) throw new Error('Set MONGO_MIGRATION_URI, MONGO_DEV, or MONGO_PROD before running the migration');

	await mongoose.connect(uri);
	try {
		const db = mongoose.connection.db;
		if (!db) throw new Error('MongoDB connection did not expose a database');
		await runPropertyToProductMigration(db, apply);
	} finally {
		await mongoose.disconnect();
	}
};

if (require.main === module) {
	main().catch((error) => {
		console.error(error);
		process.exitCode = 1;
	});
}
