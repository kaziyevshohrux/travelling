import { GraphQLScalarType, Kind, ValueNode } from 'graphql';

const parseLiteral = (node: ValueNode): unknown => {
	switch (node.kind) {
		case Kind.OBJECT:
			return Object.fromEntries(node.fields.map((field) => [field.name.value, parseLiteral(field.value)]));
		case Kind.LIST:
			return node.values.map(parseLiteral);
		case Kind.STRING:
		case Kind.BOOLEAN:
			return node.value;
		case Kind.INT:
		case Kind.FLOAT:
			return Number(node.value);
		case Kind.NULL:
			return null;
		default:
			return undefined;
	}
};

const ensureObject = (value: unknown): Record<string, unknown> => {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new TypeError('JSONObject must be a non-null object');
	}
	return value as Record<string, unknown>;
};

export const JSONObjectScalar = new GraphQLScalarType({
	name: 'JSONObject',
	description: 'A JSON object with string keys.',
	serialize: ensureObject,
	parseValue: ensureObject,
	parseLiteral(node) {
		return ensureObject(parseLiteral(node));
	},
});
