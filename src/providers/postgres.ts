// Copyright (c) 2017-2018 dirigeants. All rights reserved. MIT license.
import { QueryBuilder } from '@klasa/querybuilder';
import { SQLProvider, SchemaEntry, SchemaFolder, SettingsFolderUpdateResult, Type } from 'klasa';
import { Pool, Submittable, QueryResultRow, QueryArrayConfig, QueryConfig, QueryArrayResult, QueryResult, PoolConfig } from 'pg';
import { mergeDefault } from '@klasa/utils';
import { DEV_PGSQL } from '../../config';
import { run as databaseInitRun } from '../lib/util/DatabaseInit';
import { AnyObject } from '../lib/types/util';

export default class extends SQLProvider {

	// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
	// @ts-ignore 2416
	public qb = new QueryBuilder({
		array: type => `${type}[]`,
		arraySerializer: (values, piece, resolver) =>
			values.length ? `ARRAY[${values.map(value => resolver(value, piece)).join(', ')}]` : "'{}'",
		formatDatatype: (name, datatype, def = null) => `"${name}" ${datatype}${def === null ? '' : ` NOT NULL DEFAULT ${def}`}`
	})
		.add('boolean', { type: 'BOOL', serializer: input => this.cBoolean(input as boolean) })
		.add('integer', { type: ({ max }) => max !== null && max >= 2 ** 32 ? 'BIGINT' : 'INTEGER', serializer: input => this.cNumber(input as number | bigint) })
		.add('float', { type: 'DOUBLE PRECISION', serializer: input => this.cNumber(input as number) })
		.add('any', { type: 'JSON', serializer: input => this.cJson(input as AnyObject), arraySerializer: input => this.cArrayJson(input as AnyObject[]) })
		.add('json', { 'extends': 'any' })
		.add('permissionnode', { 'extends': 'any' })
		.add('emoji', { 'type': 'VARCHAR(128)', 'extends': 'string' })
		.add('url', { 'type': 'VARCHAR(128)', 'extends': 'string' });

	public pgsql: Pool | null = null;

	public async init() {
		if (!DEV_PGSQL) return this.unload();

		const poolOptions = mergeDefault<PoolConfig, PoolConfig>({
			host: 'localhost',
			port: 5432,
			database: 'klasa',
			max: 20,
			idleTimeoutMillis: 30000,
			connectionTimeoutMillis: 2000
		}, this.client.options.providers.postgres);

		this.pgsql = new Pool(poolOptions);
		this.pgsql.on('error', err => this.client.emit('error', err));
		await databaseInitRun(this);
	}

	public async shutdown() {
		if (this.pgsql) await this.pgsql.end();
	}

	/* Table methods */

	public async hasTable(table: string) {
		try {
			const result = await this.runAll(`SELECT true FROM pg_tables WHERE tablename = '${table}';`);
			return result.length !== 0 && result[0].bool === true;
		} catch (e) {
			return false;
		}
	}

	public createTable(table: string, rows?: readonly [string, string][]) {
		// If rows were given, use them
		if (rows) {
			return this.run(/* sql */`
				CREATE TABLE ${this.cIdentifier(table)} (${rows.map(([k, v]) => `${this.cIdentifier(k)} ${v}`).join(', ')});
			`);
		}

		// Otherwise generate datatypes from the schema
		const gateway = this.client.gateways.get(table);
		if (!gateway) throw new Error(`There is no gateway defined with the name ${table} nor an array of rows with datatypes have been given. Expected any of either.`);

		const schemaValues = [...gateway.schema.values(true)];
		const generatedColumns = schemaValues.map(this.qb.generateDatatype.bind(this.qb));
		const columns = ['"id" VARCHAR(19) NOT NULL UNIQUE', ...generatedColumns];
		return this.run(/* sql */`
			CREATE TABLE ${this.cIdentifier(table)} (
				${columns.join(', ')},
				PRIMARY KEY(id)
			);
		`);
	}

	public deleteTable(table: string) {
		return this.run(/* sql */`
			DROP TABLE IF EXISTS ${this.cIdentifier(table)};
		`);
	}

	/* Row methods */

	public async getAll(table: string, entries: readonly string[] = []): Promise<unknown[]> {
		const filter = entries.length ? ` WHERE id IN ('${entries.join("', '")}')` : '';
		const results = await this.runAll(/* sql */`
			SELECT *
			FROM ${this.cIdentifier(table)}${filter};
		`);
		return results.map(output => this.parseEntry(table, output));
	}

	public async getKeys(table: string): Promise<string[]> {
		const rows = await this.runAll(/* sql */`
			SELECT id
			FROM ${this.cIdentifier(table)};
		`);
		return rows.map(row => row.id);
	}

	public async get(table: string, key: string, value?: unknown): Promise<unknown> {
		// If a key is given (id), swap it and search by id - value
		if (typeof value === 'undefined') {
			value = key;
			key = 'id';
		}
		const output = await this.runOne(/* sql */`
			SELECT *
			FROM ${this.cIdentifier(table)}
			WHERE
				${this.cIdentifier(key)} = ${this.cValue(table, key, value)}
			LIMIT 1;
		`);
		return this.parseEntry(table, output);
	}

	public async has(table: string, id: string) {
		const result = await this.runOne(/* sql */`
			SELECT id
			FROM ${this.cIdentifier(table)}
			WHERE
				id = ${this.cString(id)}
			LIMIT 1;
		`);
		return Boolean(result);
	}

	public create(table: string, id: string, data: CreateOrUpdateValue) {
		const [keys, values] = this.parseUpdateInput(data, false);

		// Push the id to the inserts.
		if (!keys.includes('id')) {
			keys.push('id');
			values.push(id);
		}
		return this.pgsql!.query(/* sql */`
			INSERT INTO ${this.cIdentifier(table)} (${keys.map(this.cIdentifier.bind(this)).join(', ')})
			VALUES (${this.cValues(table, keys, values).join(', ')});
		`);
	}

	public update(table: string, id: string, data: CreateOrUpdateValue) {
		const [keys, values] = this.parseUpdateInput(data, false);
		const resolvedValues = this.cValues(table, keys, values);
		return this.pgsql!.query(/* sql */`
			UPDATE ${this.cIdentifier(table)}
			SET ${keys.map((key, i) => `${this.cIdentifier(key)} = ${resolvedValues[i]}`)}
			WHERE id = ${this.cString(id)};
		`);
	}

	public replace(table: string, id: string, data: CreateOrUpdateValue) {
		return this.update(table, id, data);
	}

	public delete(table: string, id: string) {
		return this.run(/* sql */`
			DELETE FROM ${this.cIdentifier(table)}
			WHERE id = ${this.cString(id)};
		`);
	}

	public addColumn(table: string, column: SchemaFolder | SchemaEntry) {
		const escapedTable = this.cIdentifier(table);
		const columns = (column instanceof SchemaFolder ? [...column.values(true)] : [column])
			.map(subpiece => `ADD COLUMN ${this.qb.generateDatatype(subpiece)}`).join(', ');
		return this.run(/* sql */`
			ALTER TABLE ${escapedTable} ${columns};
		`);
	}

	public removeColumn(table: string, columns: string | string[]) {
		const escapedTable = this.cIdentifier(table);
		const escapedColumns = typeof columns === 'string' ? this.cIdentifier(columns) : columns.map(this.cIdentifier.bind(this)).join(', ');
		return this.run(/* sql */`
			ALTER TABLE ${escapedTable}
			DROP COLUMN ${escapedColumns};
		`);
	}

	public updateColumn(table: string, entry: SchemaEntry) {
		const [column, datatype] = this.qb.generateDatatype(entry).split(' ');
		const defaultConstraint = entry.default === null
			? ''
			: `, ALTER COLUMN ${column} SET NOT NULL, ALTER COLUMN ${column} SET DEFAULT ${this.qb.serialize(entry.default, entry)}`;

		return this.pgsql!.query(/* sql */`
			ALTER TABLE ${this.cIdentifier(table)}
			ALTER COLUMN ${column}
			TYPE ${datatype}${defaultConstraint};`);
	}

	public async getColumns(table: string, schema = 'public') {
		const result = await this.runAll(/* sql */`
			SELECT column_name
			FROM information_schema.columns
			WHERE
				table_schema = ${this.cString(schema)} AND
				table_name = ${this.cString(table)};
		`);
		return result.map(row => row.column_name);
	}

	public run<T extends Submittable>(queryStream: T): T;
	public run<R extends unknown[] = unknown[], I extends unknown[] = unknown[]>(queryConfig: QueryArrayConfig<I>, values?: I): Promise<QueryArrayResult<R>>;
	public run<R extends QueryResultRow = any, I extends unknown[] = unknown[]>(queryConfig: QueryConfig<I>): Promise<QueryResult<R>>;
	public run<R extends QueryResultRow = any, I extends unknown[] = unknown[]>(queryTextOrConfig: string | QueryConfig<I>, values?: I): Promise<QueryResult<R>>;
	public run(...sql: readonly unknown[]) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore 2556
		return this.pgsql!.query(...sql);
	}

	public async runAll<R extends unknown[] = unknown[], I extends unknown[] = unknown[]>(queryConfig: QueryArrayConfig<I>, values?: I): Promise<QueryArrayResult<R>['rows']>;
	public async runAll<R extends QueryResultRow = any, I extends unknown[] = unknown[]>(queryConfig: QueryConfig<I>): Promise<QueryResult<R>['rows']>;
	public async runAll<R extends QueryResultRow = any, I extends unknown[] = unknown[]>(queryTextOrConfig: string | QueryConfig<I>, values?: I): Promise<QueryResult<R>['rows']>;
	public async runAll(...sql: readonly unknown[]) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore 2556
		const results = await this.run(...sql);
		return results.rows;
	}

	public async runOne<R extends unknown[] = unknown[], I extends unknown[] = unknown[]>(queryConfig: QueryArrayConfig<I>, values?: I): Promise<QueryArrayResult<R>['rows'][number]>;
	public async runOne<R extends QueryResultRow = any, I extends unknown[] = unknown[]>(queryConfig: QueryConfig<I>): Promise<QueryResult<R>['rows'][number]>;
	public async runOne<R extends QueryResultRow = any, I extends unknown[] = unknown[]>(queryTextOrConfig: string | QueryConfig<I>, values?: I): Promise<QueryResult<R>['rows'][number]>;
	public async runOne(...sql: readonly unknown[]) {
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore 2556
		const results = await this.run(...sql);
		return results.rows[0] || null;
	}

	private cValue(table: string, key: string, value: unknown) {
		const gateway = this.client.gateways.get(table);
		if (typeof gateway === 'undefined') return this.cUnknown(value);

		const entry = gateway.schema.get(key) as SchemaEntry;
		if (!entry || entry.type === 'Folder') return this.cUnknown(value);

		const qbEntry = this.qb.get(entry.type);
		return qbEntry
			? entry.array
				? qbEntry.arraySerializer(value as unknown[], entry, qbEntry.serializer)
				: qbEntry.serializer(value, entry)
			: this.cUnknown(value);
	}

	private cValues(table: string, keys: readonly string[], values: readonly unknown[]) {
		const gateway = this.client.gateways.get(table);
		if (typeof gateway === 'undefined') return values.map(value => this.cUnknown(value));

		const { schema } = gateway;
		const parsedValues: string[] = [];
		for (let i = 0; i < keys.length; ++i) {
			const key = keys[i];
			const value = values[i];
			const entry = schema.get(key) as SchemaEntry;
			if (!entry || entry.type === 'Folder') {
				parsedValues.push(this.cUnknown(value));
				continue;
			}

			const qbEntry = this.qb.get(entry.type);
			parsedValues.push(qbEntry
				? entry.array
					? qbEntry.arraySerializer(value as unknown[], entry, qbEntry.serializer)
					: qbEntry.serializer(value, entry)
				: this.cUnknown(value));
		}
		return parsedValues;
	}

	private cIdentifier(identifier: string) {
		const escaped = identifier.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
		return `"${escaped}"`;
	}

	private cString(value: string) {
		const escaped = value.replace(/'/g, "''");
		return `'${escaped}'`;
	}

	private cNumber(value: number | bigint) {
		return value.toString();
	}

	private cBoolean(value: boolean) {
		return value ? 'TRUE' : 'FALSE';
	}

	private cDate(value: Date) {
		return this.cNumber(value.getTime());
	}

	private cArray(value: readonly unknown[]) {
		return `ARRAY[${value.map(this.cUnknown.bind(this)).join(', ')}]`;
	}

	private cJson(value: AnyObject) {
		const escaped = this.cString(JSON.stringify(value));
		return `${escaped}::JSON`;
	}

	private cArrayJson(value: AnyObject[]) {
		return `ARRAY[${value.map(json => this.cString(JSON.stringify(json)))}]::JSON[]`;
	}

	private cUnknown(value: unknown): string {
		switch (typeof value) {
			case 'string':
				return this.cString(value);
			case 'bigint':
			case 'number':
				return this.cNumber(value);
			case 'boolean':
				return this.cBoolean(value);
			case 'object':
				if (value === null) return 'NULL';
				if (Array.isArray(value)) return this.cArray(value);
				if (value instanceof Date) return this.cDate(value);
				return this.cJson(value);
			case 'undefined':
				return 'NULL';
			default:
				throw new TypeError(`Cannot serialize a ${new Type(value)}`);
		}
	}

}

type CreateOrUpdateValue = SettingsFolderUpdateResult[] | [string, unknown][] | Record<string, unknown> | {};
