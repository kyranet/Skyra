import { DbSet } from '#lib/database';
import { LanguageKeys } from '#lib/i18n/languageKeys';
import { SkyraCommand } from '#lib/structures';
import { CdnUrls } from '#lib/types/Constants';
import type { YarnPkg } from '#lib/types/definitions/Yarnpkg';
import { fetch, FetchResultTypes, sendLoadingMessage } from '#utils/util';
import { ApplyOptions } from '@sapphire/decorators';
import { cutText } from '@sapphire/utilities';
import { Message, MessageEmbed } from 'discord.js';
import type { TFunction } from 'i18next';

@ApplyOptions<SkyraCommand.Options>({
	aliases: ['npm', 'npm-package', 'yarn-package', 'pnpm', 'pnpm-package'],
	cooldown: 10,
	description: LanguageKeys.Commands.Developers.YarnDescription,
	extendedHelp: LanguageKeys.Commands.Developers.YarnExtended,
	permissions: ['EMBED_LINKS']
})
export class UserCommand extends SkyraCommand {
	public async run(message: Message, args: SkyraCommand.Args, context: SkyraCommand.Context) {
		const pkg = encodeURIComponent((await args.rest('cleanString')).replaceAll(' ', '-').toLowerCase());
		const { t } = args;
		const response = await sendLoadingMessage(message, t);

		const result = await this.fetchApi(t, pkg);

		if (result.time && Reflect.has(result.time, 'unpublished')) throw t(LanguageKeys.Commands.Developers.YarnUnpublishedPackage, { pkg });

		const dataEmbed = await this.buildEmbed(result, message, t, context);
		return response.edit(undefined, dataEmbed);
	}

	private async fetchApi(t: TFunction, pkg: string) {
		try {
			return await fetch<YarnPkg.PackageJson>(`https://registry.yarnpkg.com/${pkg}`, FetchResultTypes.JSON);
		} catch {
			throw t(LanguageKeys.Commands.Developers.YarnPackageNotFound, { pkg });
		}
	}

	private async buildEmbed(result: YarnPkg.PackageJson, message: Message, t: TFunction, context: SkyraCommand.Context) {
		const maintainers = result.maintainers.map((user) => `[${user.name}](${user.url ?? `https://www.npmjs.com/~${user.name}`})`);
		const latestVersion = result.versions[result['dist-tags'].latest];
		const dependencies = latestVersion.dependencies
			? this.trimArray(Object.keys(latestVersion.dependencies), t(LanguageKeys.Commands.Developers.YarnEmbedMoreText))
			: null;

		const author = this.parseAuthor(result.author);
		const dateCreated = result.time
			? t(LanguageKeys.Globals.DateValue, { value: new Date(result.time.created).getTime() })
			: t(LanguageKeys.Globals.Unknown);
		const dateModified = result.time
			? t(LanguageKeys.Globals.DateValue, { value: new Date(result.time.modified).getTime() })
			: t(LanguageKeys.Globals.Unknown);

		const { deprecated } = latestVersion;
		const description = cutText(result.description ?? '', 1000);
		const latestVersionNumber = result['dist-tags'].latest;
		const license = result.license || t(LanguageKeys.Globals.None);
		const mainFile = latestVersion.main || 'index.js';

		return new MessageEmbed()
			.setTitle(result.name)
			.setURL(
				context.commandName.includes('yarn')
					? `https://yarnpkg.com/en/package/${result.name}`
					: `https://www.npmjs.com/package/${result.name}`
			)
			.setThumbnail(CdnUrls.NodeJSLogo)
			.setColor(await DbSet.fetchColor(message))
			.setDescription(
				cutText(
					[
						description,
						'',
						author ? t(LanguageKeys.Commands.Developers.YarnEmbedDescriptionAuthor, { author }) : undefined,
						t(LanguageKeys.Commands.Developers.YarnEmbedDescriptionMaintainers, { maintainers }),
						t(LanguageKeys.Commands.Developers.YarnEmbedDescriptionLatestVersion, { latestVersionNumber }),
						t(LanguageKeys.Commands.Developers.YarnEmbedDescriptionLicense, { license }),
						t(LanguageKeys.Commands.Developers.YarnEmbedDescriptionMainFile, { mainFile }),
						t(LanguageKeys.Commands.Developers.YarnEmbedDescriptionDateCreated, { dateCreated }),
						t(LanguageKeys.Commands.Developers.YarnEmbedDescriptionDateModified, { dateModified }),
						deprecated ? t(LanguageKeys.Commands.Developers.YarnEmbedDescriptionDeprecated, { deprecated }) : undefined,
						'',
						t(LanguageKeys.Commands.Developers.YarnEmbedDescriptionDependenciesLabel),
						dependencies?.length
							? t(LanguageKeys.Globals.AndListValue, { value: dependencies })
							: t(LanguageKeys.Commands.Developers.YarnEmbedDescriptionDependenciesNoDeps)
					]
						.filter((part) => part !== undefined)
						.join('\n'),
					2000
				)
			);
	}

	/**
	 * Trims an array to the first 10 entries of that array (indices 0-9) and adds a 10th index containing a count of extra entries
	 * @remark If the array has a length of less than 10 it is returned directly
	 * @param arr The array to trim
	 * @param moreText The text to show in the last entry of the array
	 */
	private trimArray(arr: string[], moreText: string) {
		if (arr.length > 10) {
			const len = arr.length - 10;
			arr = arr.slice(0, 10);
			arr.push(`${len} ${moreText}`);
		}

		return arr;
	}

	/**
	 * Parses an NPM author into a markdown-linked string
	 * @param author The author to parse
	 * @returns Markdown-linked string or undefined (if no author exists)
	 */
	private parseAuthor(author?: YarnPkg.Author): string | undefined {
		// If there is no author then return undefined
		if (!author) return undefined;

		// Parse the author name
		const authorName = `**${author.name}**`;
		const authorUrl = author.name.startsWith('@')
			? // If the author is an organization then use the Organization url
			  encodeURI(author.url ?? `https://www.npmjs.com/org/${author.name.slice(1)}`)
			: // Otherwise use the User url
			  encodeURI(author.url ?? `https://www.npmjs.com/~${author.name}`);

		return `[${authorName}](${authorUrl})`;
	}
}
