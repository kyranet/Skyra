const Command = require("../../classes/command");

const { get: fetchProfile } = require("../../functions/overwatch");
const OVERWATCH = require("../../utils/overwatch.js");
const snekfetch = require("snekfetch");

const emojis = {
    bronze: { emoji: "<:Bronze:326683073691385856>", text: "(B)" },
    silver: { emoji: "<:Silver:326683073343127554>", text: "(S)" },
    gold: { emoji: "<:Gold:326683073955758100>", text: "(G)" },
    platinum: { emoji: "<:Platinum:326683073288863745>", text: "(P)" },
    diamond: { emoji: "<:Diamond:326683073959952384>", text: "(D)" },
    master: { emoji: "<:Master:326683073628471298>", text: "(M)" },
    grandmaster: { emoji: "<:GrandMaster:326683074157084672>", text: "(GM)" },
};

const list = data => Object.entries(data).map(([key, value]) => `**${key}**: ${value}`).join("\n");
const doRequest = url => snekfetch.get(url).then(d => JSON.parse(d.text));

module.exports = class Overwatch extends Command {

    constructor(...args) {
        super(...args, "overwatch", {
            aliases: ["ow"],
            mode: 2,

            usage: "<BattleTag:string> [pc|psn|xbl] [eu|us|kr] [featured|playedheroes|combat|assists|records|gamestats|average|awards] [qp|quickplay|comp|competitive]",
            usageDelim: " ",
            description: "Check stats from somebody in Overwatch.",
            extendedHelp: Command.strip`
                Cheers love! The cavalry is here!
                
                = Usage =
                Skyra, overwatch [BattleTag] [platform] [server] [hero] [type] [gamemode]
                BattleTag :: Your BattleTag from Battle.net.
                Platform  :: Either 'PC', 'PSN' or 'XBL'.
                Server    :: Either 'EU' (Europe), 'US' (America) or 'KR' (Asia).
                Type      :: The data to display: 'Featured', 'PlayedHeroes', 'Combat', 'Assists', 'Records', 'GameStats', 'Average' and 'Awards'.
                Gamemode  :: Either 'qp'/'quickplay' or 'comp'/'competitive'.

                = Notes =
                    • You can skip any of the arguments after 'BattleTag'. If you write your BattleTag and 'competitive', I will show the competitive stats.
                    • If 'platform' is not specified, I will fetch by 'PC' if it has a discriminator number, otherwise 'XBL'/'PSN'.
                    • If 'server' is not specified, I will retrieve the career profile with higher level.
                    • If 'type' is not specified, I will display 'Featured'.
                    • If 'gamemode' is not specified, I will show the data from 'quickplay'.
                
                Examples:
                • Skyra, overwatch Knight#22123 pc eu
                • Skyra, overwatch Knight#22123
                    The two examples above will return the same information, as the battletag has a discriminator number (PC only) and has the highest level in EU.
                
                • Skyra, overwatch Knight#22123 competitive
                    I will display the featured content for competitive.
            `,
        });

        this.api = "https://playoverwatch.com/en-us/search/account-by-name/";
    }

    async run(msg, [user, platform, server, type = "featured", mode = "quickplay"]) {
        if (mode === "qp") mode = "quickplay";
        if (mode === "comp") mode = "competitive";

        const profile = {
            platform: platform ? platform.toLowerCase() : null,
            server: server ? server.toLowerCase() : null,
            type: type.toLowerCase(),
            gamemode: mode.toLowerCase(),
        };

        const resolved = await this.resolveProfile(user, profile);
        const output = await this.fetchData(resolved.careerLink, profile);
        if (output instanceof Buffer) return msg.send({ files: [{ attachment: output, name: "overwatch.png" }] });
        const { overview, title, data, url } = output;
        const embed = new this.client.methods.Embed()
            .setURL(url)
            .setColor(msg.color)
            .setThumbnail(overview.profile.avatar)
            .setTitle(`Overwatch Stats: ${resolved.platformDisplayName} [${mode === "quickplay" ? "QP" : "COMP"}]`)
            .setFooter("📊 Statistics")
            .setDescription(`**❯ ${title}**\n\n${data}`)
            .setTimestamp();

        return msg.send({ embed });
    }

    resolvePlayer(user, profile) {
        const [username, tag = null] = user.split("#");
        if (tag || profile.platform === "pc") {
            if (!tag) throw "you must write your discriminator number.";
            else if (!/\b\d{4,5}\b/.test(tag)) throw "you must write a valid discriminator number.";
            return Object.assign(profile, {
                battletag: `${username}-${tag}`,
                user: username,
                tag,
            });
        }
        return Object.assign(profile, {
            battletag: user,
            user,
            tag,
        });
    }

    async resolveProfile(...args) {
        const player = this.resolvePlayer(...args);
        const verifier = `${this.api + encodeURIComponent(player.user)}${player.tag ? `-${player.tag}` : ""}`;
        const profiles = await doRequest(verifier).catch(() => { throw "make sure you have written your profile correctly, this is case sensitive."; });
        if (profiles.length === 0) throw "make sure you have written your profile correctly, this is case sensitive.";
        const pf = player.platform;
        const sv = player.server;
        let filter = null;
        if (pf && !sv) filter = p => new RegExp(`/career/${pf}/\\w+/`).test(p.careerLink);
        else if (!pf && sv) filter = p => new RegExp(`/career/\\w+/${sv}/`).test(p.careerLink);
        else if (pf && sv) filter = p => new RegExp(`/career/${pf}/${sv}/`).test(p.careerLink);
        const careerLinks = filter ? profiles.filter(filter) : profiles;
        switch (careerLinks.length) {
            case 0: throw `this user doesn't have any data for \`${pf ? `Platform: ${pf} ` : ""}\`\`${sv ? `Server: ${sv}` : ""}\`.`;
            case 1: return careerLinks[0];
            default: return careerLinks.sort((a, b) => b.level - a.level)[0];
        }
    }

    async fetchData(selected, { platform, server, type, gamemode }) {
        const path = selected.split("/");
        path[path.length - 1] = encodeURIComponent(path[path.length - 1]);
        const data = await fetchProfile(`https://playoverwatch.com/en-us${path.join("/")}`);
        const { overview, url } = data;
        const statistics = data[gamemode];
        const output = { overview, url };
        switch (type) {
            case "featured":
                output.title = "Featured";
                output.data = `**Competitive rank**: ${overview.competitiveRank.rank ? this.resolveEmoji(overview.competitiveRank.rank) : "Unranked"}\n${list(statistics.highlight)}`;
                return output;
            case "playedheroes": return OVERWATCH("playedheroes", data, { platform, server, gamemode });
            case "combat":
                output.title = "Combat";
                output.data = list(statistics.stats.Combat);
                return output;
            case "assists":
                output.title = "Assists";
                output.data = list(statistics.stats.Assists);
                return output;
            case "records":
                output.title = "Records";
                output.data = list(statistics.stats.Best);
                return output;
            case "gamestats":
                output.title = "Featured";
                output.data = `${list(statistics.stats.Game)}\n${list(statistics.stats.Deaths)}\n\n${list(statistics.stats.Miscellaneous)}`;
                return output;
            case "average":
                output.title = "Average Stats";
                output.data = list(statistics.stats.Average);
                return output;
            case "awards":
                output.title = "Awards";
                output.data = list(statistics.stats["Match Awards"]);
                return output;
            // no default
        }
        return null;
    }

    resolveEmoji(msg, rank) {
        const permission = msg.guild ? Command.hasPermission(msg, "USE_EXTERNAL_EMOJIS") : true;
        let role;
        if (rank < 1500) role = emojis.bronze;
        else if (rank < 2000) role = emojis.silver;
        else if (rank < 2500) role = emojis.gold;
        else if (rank < 3000) role = emojis.platinum;
        else if (rank < 3500) role = emojis.diamond;
        else if (rank < 4000) role = emojis.master;
        else role = emojis.grandmaster;
        return `${rank} ${permission ? role.emoji : role.text}`;
    }

};
