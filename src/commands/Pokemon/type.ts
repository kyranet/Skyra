import { TypeEntry, Types } from '@favware/graphql-pokemon';
import { toTitleCase } from '@klasa/utils';
import { SkyraCommand, SkyraCommandOptions } from '@lib/structures/SkyraCommand';
import { ApplyOptions } from '@skyra/decorators';
import { fetchGraphQLPokemon, getTypeMatchup, parseBulbapediaURL, POKEMON_EMBED_THUMBNAIL } from '@utils/Pokemon';
import { getColor } from '@utils/util';
import { MessageEmbed } from 'discord.js';
import { KlasaMessage } from 'klasa';

@ApplyOptions<SkyraCommandOptions>({
	aliases: ['matchup', 'weakness', 'advantage'],
	cooldown: 10,
	description: language => language.tget('COMMAND_TYPE_DESCRIPTION'),
	extendedHelp: language => language.tget('COMMAND_TYPE_EXTENDED'),
	requiredPermissions: ['EMBED_LINKS'],
	usage: '<types:type{2}>'
})
export default class extends SkyraCommand {

	public async init() {
		this.createCustomResolver('type', (arg: string | string[], _, message) => {
			arg = (arg as string).toLowerCase().split(' ');

			if (arg.length > 2) throw message.language.tget('COMMAND_TYPE_TOO_MANY_TYPES');

			for (const type of arg) {
				if (!(toTitleCase(type) in Types)) throw message.language.tget('COMMAND_TYPE_NOT_A_TYPE', type);
			}

			return arg;
		});
	}

	public async run(message: KlasaMessage, [types]: [Types[]]) {
		const typeMatchups = await this.fetchAPI(message, types);

		const embedTranslations = message.language.tget('COMMAND_TYPE_EMBED_DATA');
		return message.sendEmbed(new MessageEmbed()
			.setColor(getColor(message))
			.setAuthor(`${embedTranslations.TYPE_EFFECTIVENESS_FOR(types)}`, POKEMON_EMBED_THUMBNAIL)
			.addField(`__${embedTranslations.OFFENSIVE}__`, [
				`${embedTranslations.SUPER_EFFECTIVE_AGAINST}: ${this.parseEffectiveMatchup(typeMatchups.attacking.doubleEffectiveTypes, typeMatchups.attacking.effectiveTypes)}`,
				'',
				`${embedTranslations.DEALS_NORMAL_DAMAGE_TO}: ${this.parseRegularMatchup(typeMatchups.attacking.normalTypes)}`,
				'',
				`${embedTranslations.NOT_VERY_EFFECTIVE_AGAINST}: ${this.parseResistedMatchup(typeMatchups.attacking.doubleResistedTypes, typeMatchups.attacking.resistedTypes)}`,
				'',
				`${typeMatchups.attacking.effectlessTypes.length ? `${embedTranslations.DOES_NOT_AFFECT}: ${this.parseRegularMatchup(typeMatchups.attacking.effectlessTypes)}` : ''}`
			].join('\n'))
			.addField(`__${embedTranslations.DEFENSIVE}__`, [
				`${embedTranslations.VULNERABLE_TO}: ${this.parseEffectiveMatchup(typeMatchups.defending.doubleEffectiveTypes, typeMatchups.defending.effectiveTypes)}`,
				'',
				`${embedTranslations.TAKES_NORMAL_DAMAGE_FROM}: ${this.parseRegularMatchup(typeMatchups.defending.normalTypes)}`,
				'',
				`${embedTranslations.RESISTS}: ${this.parseResistedMatchup(typeMatchups.defending.doubleResistedTypes, typeMatchups.defending.resistedTypes)}`,
				'',
				`${typeMatchups.defending.effectlessTypes.length ? `${embedTranslations.NOT_AFFECTED_BY}: ${this.parseRegularMatchup(typeMatchups.defending.effectlessTypes)}` : ''}`
			].join('\n'))
			.addField(embedTranslations.EXTERNAL_RESOURCES, [
				`[Bulbapedia](${parseBulbapediaURL(`https://bulbapedia.bulbagarden.net/wiki/${types[0]}_(type)`)} )`,
				`[Serebii](https://www.serebii.net/pokedex-sm/${types[0].toLowerCase()}.shtml)`,
				`[Smogon](http://www.smogon.com/dex/sm/types/${types[0]})`
			].join(' | ')));
	}

	private async fetchAPI(message: KlasaMessage, types: Types[]) {
		try {
			const { data } = await fetchGraphQLPokemon<'getTypeMatchup'>(getTypeMatchup, { types });
			return data.getTypeMatchup;
		} catch {
			throw message.language.tget('COMMAND_TYPE_QUERY_FAIL', types);
		}
	}

	private parseEffectiveMatchup(doubleEffectiveTypes: TypeEntry['doubleEffectiveTypes'], effectiveTypes: TypeEntry['effectiveTypes']) {
		return doubleEffectiveTypes
			.map(type => `${type} (x4)`)
			.concat(effectiveTypes.map(type => `${type} (x2)`))
			.map(type => `\`${type}\``)
			.join(', ');
	}

	private parseResistedMatchup(doubleResistedTypes: TypeEntry['doubleResistedTypes'], resistedTypes: TypeEntry['resistedTypes']) {
		return doubleResistedTypes
			.map(type => `${type} (x0.25)`)
			.concat(resistedTypes.map(type => `${type} (x0.5)`))
			.map(type => `\`${type}\``)
			.join(', ');
	}

	private parseRegularMatchup(regularMatchup: TypeEntry['normalTypes'] | TypeEntry['effectlessTypes']) {
		return regularMatchup.map(type => `\`${type}\``).join(', ');
	}

}
