import { toTitleCase } from '@klasa/utils';
import { MessageEmbed } from 'discord.js';
import { CommandStore, KlasaMessage } from 'klasa';
import { SkyraCommand } from '../../lib/structures/SkyraCommand';
import { fetchGraphQLPokemon, getAbilityDetailsByFuzzy, parseBulbapediaURL, POKEMON_EMBED_THUMBNAIL } from '../../lib/util/Pokemon';
import { getColor } from '../../lib/util/util';

export default class extends SkyraCommand {

	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			aliases: ['abilities', 'pokeability'],
			cooldown: 10,
			description: language => language.tget('COMMAND_ABILITY_DESCRIPTION'),
			extendedHelp: language => language.tget('COMMAND_ABILITY_EXTENDED'),
			requiredPermissions: ['EMBED_LINKS'],
			usage: '<ability:str>'
		});
	}

	public async run(message: KlasaMessage, [ability]: [string]) {
		try {
			const { getAbilityDetailsByFuzzy: abilityDetails } = (await this.fetchAPI(message, ability.toLowerCase())).data;

			const embedTranslations = message.language.tget('COMMAND_ABILITY_EMEBED_DATA');
			return message.sendEmbed(new MessageEmbed()
				.setColor(getColor(message))
				.setAuthor(`${embedTranslations.ABILITY} - ${toTitleCase(abilityDetails.name)}`, POKEMON_EMBED_THUMBNAIL)
				.setDescription(abilityDetails.desc || abilityDetails.shortDesc)
				.addField(embedTranslations.EXTERNAL_RESOURCES, [
					`[Bulbapedia](${parseBulbapediaURL(abilityDetails.bulbapediaPage)} )`,
					`[Serebii](${abilityDetails.serebiiPage})`,
					`[Smogon](${abilityDetails.smogonPage})`
				].join(' | ')));
		} catch (err) {
			throw message.language.tget('COMMAND_ABILITY_QUERY_FAIL', ability);
		}
	}

	private fetchAPI(message: KlasaMessage, item: string) {
		return fetchGraphQLPokemon<'getAbilityDetailsByFuzzy'>(message, getAbilityDetailsByFuzzy(item));
	}

}
