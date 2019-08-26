# Skyra [![Discord](https://discordapp.com/api/guilds/254360814063058944/embed.png)](https://skyra.pw/join)

[![Total alerts](https://img.shields.io/lgtm/alerts/g/kyranet/Skyra.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/kyranet/Skyra/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/kyranet/Skyra.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/kyranet/Skyra/context:javascript)
[![Discord Bots](https://discordbots.org/api/widget/status/266624760782258186.svg?noavatar=true)](https://discordbots.org/bot/266624760782258186)
[![Discord Bots](https://discordbots.org/api/widget/servers/266624760782258186.svg?noavatar=true)](https://discordbots.org/bot/266624760782258186)
[![Discord Bots](https://discordbots.org/api/widget/upvotes/266624760782258186.svg?noavatar=true)](https://discordbots.org/bot/266624760782258186)

## Development Requirements

- [`Node.js`]: To run the project.
- [`RethinkDB`]: To store persistent data.
- [`Lavalink`]: (Dev Optional) Audio server.
- [`Ny-API`]: (Dev Optional) Central server.

[`Node.js`]: https://nodejs.org/en/download/current/
[`RethinkDB`]: https://rethinkdb.com/docs/install/
[`Lavalink`]: https://github.com/Frederikam/Lavalink
[`Ny-API`]: https://github.com/kyranet/Ny-API

## Set-Up

Copy and paste the [`config.ts.example`] file and rename it to `config.ts`, then fill it with the precise variables.
Once all development requirements are set up:

```bash
# Lints and format all the code:
$ yarn lint

# Run Skyra in development mode:
$ yarn start

# Run Skyra in production mode, requires
# Lavalink and Ny-API to be running:
$ yarn pm2:start
```

> **Note**: Before pushing to the repository, please run `yarn lint` so formatting stays consistent and there are no
linter warnings.

[`config.ts.example`]: /config.ts.example

## Story

**A bit of story**: Skyra, formerly known as kyraBOT (renamed in the middle of March of 2017), is a multipurpose Discord
Bot that was born out of curiosity in a SoloLearn guild. With help from other developers, due to my lack of experience
(I made websites and templates for After Effects, but never a backend application). Skyra was born. Skyra's name comes
from a comment made by a user, joining "kyra" with "SkyNET", creating "SkyraNET", I liked the name and later, she got
renamed to "Skyra". Originally, it was going to be renamed as "Shiny" (name taken for the currency) or "Shyy" (original
name from the lore) however I decided "Skyra" would be a better name.

Skyra does not only feature almost every feature that is needed in the majority of guilds (discord servers) while being
completely configurable, she also has a backstory, inherited from the lore I have been creating since I was a child.

There have been over 13 rewrites with an active development of over two years, I have met many developers and friends in
Discord, and in February 2017, I met the Dirigeants team, upon which I started to contribute to Komada, and later, for
Klasa.

*Who knows, I might write a book someday for Skyra's lore.*

The development for a next major version has migrated to [Lyrch].

[Lyrch]: https://github.com/kyranet/Lyrch

## Links

**Skyra links**

- [Skyra Invite Link](https://skyra.pw/invite)
- [Support Server](https://skyra.pw/join)
- [Patreon](https://www.patreon.com/kyranet)
- [Translation](https://skyra.pw/translate)

**Framework links**

- [Klasa's Website](https://klasa.js.org)
