import { Kind } from 'graphql';
import { JSONObjectScalar } from './json-object.scalar';

describe('JSONObjectScalar', () => {
	it('accepts objects and rejects non-object roots', () => {
		expect(JSONObjectScalar.parseValue({ durationMinutes: 30 })).toEqual({ durationMinutes: 30 });
		expect(() => JSONObjectScalar.parseValue([])).toThrow('JSONObject must be a non-null object');
	});

	it('parses nested object literals', () => {
		expect(
			JSONObjectScalar.parseLiteral({
				kind: Kind.OBJECT,
				fields: [
					{
						kind: Kind.OBJECT_FIELD,
						name: { kind: Kind.NAME, value: 'amenities' },
						value: { kind: Kind.LIST, values: [{ kind: Kind.STRING, value: 'wifi', block: false }] },
					},
				],
			},
		),
	).toEqual({ amenities: ['wifi'] });
	});
});
