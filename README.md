# Skyra [![Discord](https://discord.com/api/guilds/254360814063058944/embed.png)](https://join.skyra.pw)

[![Total alerts](https://img.shields.io/lgtm/alerts/g/skyra-project/skyra.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/skyra-project/skyra/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/skyra-project/skyra.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/skyra-project/Skyra/context:javascript)
[![Coverage Status](https://coveralls.io/repos/github/skyra-project/skyra/badge.svg?branch=main)](https://coveralls.io/github/skyra-project/skyra?branch=main)
[![Status](https://top.gg/api/widget/status/266624760782258186.svg?noavatar=true)](https://top.gg/bot/266624760782258186)
[![Servers](https://top.gg/api/widget/servers/266624760782258186.svg?noavatar=true)](https://top.gg/bot/266624760782258186)
[![Upvotes](https://top.gg/api/widget/upvotes/266624760782258186.svg?noavatar=true)](https://top.gg/bot/266624760782258186)

## Developing on Skyra

### Requirements

-   [`Node.js`]: To run the project.
-   [`PostgreSQL`]: To store persistent data.

### Optional additions

-   [`Lavalink`]: Audio server.
-   [`InfluxDB`]: Metrics platform
-   [`GraphQL-Pokemon`]: Pokemon API
-   [`Saelem`]: Horoscope API
-   [`Redis`]: Caching for [`Saelem`]

### [Set-Up - Refer to CONTRIBUTING.md]

## A note to aspiring developers who want to self host Skyra

We are not supportive of the idea of people self hosting Skyra as we put a very high priority on providing the best experience we can for our end-users. This image of Skyra will be diminished if people self-host her as they will not use identical architecture to what we do and likely not put in the same amount of effort as we do. If Skyra is lacking a feature you'd like to see, please refer to the developing guidelines above and if you can add that feature it will be in Skyra to stay.

Furthermore, Skyra has not been build with the idea of self hosting in mind and she makes use of many services that you will need to maintain in a production environment for full functionality. For example

-   Skyra uses many external API's for which you would have to create API keys
-   Skyra uses Lavalink as music module, this means you need to host your own instance of Lavalink (a Java application)
-   While Skyra can work with a JSON based database, it is extremely ill-advised to do so in production. Instead in production you should be using PostgreSQL, another thing to host yourself.
-   Skyra requires [Evlyn] in order to run properly, this means you will also need to host this Node.JS application on the same network as Skyra

All this said, if you really are going to self-host Skyra please take heed, she **_will absolutely not_** run on services such as [Glitch] or [Heroku]. You **_will need_** a VPS (Virtual Private Server), for example from a provider such as [Netcup] (our provider) or [DigitalOcean].

Sidenote, if you really think you're clever enough to self host then you're probably also smart enough to write your own bot.

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

_Who knows, I might write a book someday for Skyra's lore._

## Links

**Skyra links**

-   [Skyra Invite Link]
-   [Support Server]
-   [Patreon]

**Framework links**

-   [Klasa's Website]

## Buy us some doughnuts

Skyra Project is open source and always will be, even if we don't get donations. That said, we know there are amazing people who
may still want to donate just to show their appreciation. Thanks you very much in advance!

We accept donations through Patreon, BitCoin, Ethereum, and Litecoin. You can use the buttons below to donate through your method of choice.

| Donate With |         QR         |                                                                  Address                                                                  |
| :---------: | :----------------: | :---------------------------------------------------------------------------------------------------------------------------------------: |
|   Patreon   | ![PatreonImage][]  |                                               [Click Here](https://www.patreon.com/kyranet)                                               |
|   PayPal    |  ![PayPalImage][]  |                     [Click Here](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=CET28NRZTDQ8L)                      |
|   BitCoin   | ![BitcoinImage][]  |         [3JNzCHMTFtxYFWBnVtDM9Tt34zFbKvdwco](bitcoin:3JNzCHMTFtxYFWBnVtDM9Tt34zFbKvdwco?amount=0.01&label=Skyra%20Discord%20Bot)          |
|  Ethereum   | ![EthereumImage][] | [0xcB5EDB76Bc9E389514F905D9680589004C00190c](ethereum:0xcB5EDB76Bc9E389514F905D9680589004C00190c?amount=0.01&label=Skyra%20Discord%20Bot) |
|  Litecoin   | ![LitecoinImage][] |         [MNVT1keYGMfGp7vWmcYjCS8ntU8LNvjnqM](litecoin:MNVT1keYGMfGp7vWmcYjCS8ntU8LNvjnqM?amount=0.01&label=Skyra%20Discord%20Bot)         |

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/kyranet"><img src="https://avatars0.githubusercontent.com/u/24852502?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Antonio Román</b></sub></a><br /><a href="#audio-kyranet" title="Audio">🔊</a> <a href="#a11y-kyranet" title="Accessibility">️️️️♿️</a> <a href="https://github.com/skyra-project/skyra/issues?q=author%3Akyranet" title="Bug reports">🐛</a> <a href="https://github.com/skyra-project/skyra/commits?author=kyranet" title="Code">💻</a> <a href="https://github.com/skyra-project/skyra/commits?author=kyranet" title="Documentation">📖</a> <a href="#design-kyranet" title="Design">🎨</a> <a href="#ideas-kyranet" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-kyranet" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-kyranet" title="Maintenance">🚧</a> <a href="#platform-kyranet" title="Packaging/porting to new platform">📦</a> <a href="#projectManagement-kyranet" title="Project Management">📆</a> <a href="#question-kyranet" title="Answering Questions">💬</a> <a href="https://github.com/skyra-project/skyra/pulls?q=is%3Apr+reviewed-by%3Akyranet" title="Reviewed Pull Requests">👀</a> <a href="#security-kyranet" title="Security">🛡️</a> <a href="#translation-kyranet" title="Translation">🌍</a> <a href="https://github.com/skyra-project/skyra/commits?author=kyranet" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://favware.tech/"><img src="https://avatars3.githubusercontent.com/u/4019718?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jeroen Claassens</b></sub></a><br /><a href="#audio-Favna" title="Audio">🔊</a> <a href="#a11y-Favna" title="Accessibility">️️️️♿️</a> <a href="https://github.com/skyra-project/skyra/issues?q=author%3AFavna" title="Bug reports">🐛</a> <a href="https://github.com/skyra-project/skyra/commits?author=Favna" title="Code">💻</a> <a href="https://github.com/skyra-project/skyra/commits?author=Favna" title="Documentation">📖</a> <a href="#design-Favna" title="Design">🎨</a> <a href="#ideas-Favna" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-Favna" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-Favna" title="Maintenance">🚧</a> <a href="#platform-Favna" title="Packaging/porting to new platform">📦</a> <a href="#projectManagement-Favna" title="Project Management">📆</a> <a href="#question-Favna" title="Answering Questions">💬</a> <a href="https://github.com/skyra-project/skyra/pulls?q=is%3Apr+reviewed-by%3AFavna" title="Reviewed Pull Requests">👀</a> <a href="#security-Favna" title="Security">🛡️</a> <a href="#translation-Favna" title="Translation">🌍</a> <a href="https://github.com/skyra-project/skyra/commits?author=Favna" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://jaczaus.me/"><img src="https://avatars3.githubusercontent.com/u/23615291?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jacz</b></sub></a><br /><a href="https://github.com/skyra-project/skyra/commits?author=MrJacz" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/vladfrangu"><img src="https://avatars3.githubusercontent.com/u/17960496?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Vlad Frangu</b></sub></a><br /><a href="https://github.com/skyra-project/skyra/commits?author=vladfrangu" title="Code">💻</a> <a href="https://github.com/skyra-project/skyra/commits?author=vladfrangu" title="Documentation">📖</a> <a href="https://github.com/skyra-project/skyra/issues?q=author%3Avladfrangu" title="Bug reports">🐛</a> <a href="https://github.com/skyra-project/skyra/pulls?q=is%3Apr+reviewed-by%3Avladfrangu" title="Reviewed Pull Requests">👀</a> <a href="#userTesting-vladfrangu" title="User Testing">📓</a></td>
    <td align="center"><a href="https://github.com/Skillz4Killz"><img src="https://avatars3.githubusercontent.com/u/23035000?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Skillz4Killz</b></sub></a><br /><a href="https://github.com/skyra-project/skyra/commits?author=Skillz4Killz" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/cfanoulis"><img src="https://avatars3.githubusercontent.com/u/38255093?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Charalampos Fanoulis</b></sub></a><br /><a href="https://github.com/skyra-project/skyra/commits?author=cfanoulis" title="Code">💻</a> <a href="#translation-cfanoulis" title="Translation">🌍</a> <a href="#ideas-cfanoulis" title="Ideas, Planning, & Feedback">🤔</a> <a href="#projectManagement-cfanoulis" title="Project Management">📆</a> <a href="#maintenance-cfanoulis" title="Maintenance">🚧</a></td>
    <td align="center"><a href="https://quantumlytangled.com/"><img src="https://avatars1.githubusercontent.com/u/7919610?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Nejc Drobnic</b></sub></a><br /><a href="https://github.com/skyra-project/skyra/commits?author=QuantumlyTangled" title="Code">💻</a> <a href="#translation-QuantumlyTangled" title="Translation">🌍</a> <a href="#ideas-QuantumlyTangled" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/skyra-project/skyra/commits?author=QuantumlyTangled" title="Documentation">📖</a> <a href="#infra-QuantumlyTangled" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
  </tr>
  <tr>
    <td align="center"><a href="http://moorewebcode.com/"><img src="https://avatars1.githubusercontent.com/u/25398066?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Hutch</b></sub></a><br /><a href="https://github.com/skyra-project/skyra/commits?author=tech6hutch" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/PyroTechniac"><img src="https://avatars2.githubusercontent.com/u/39341355?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Gryffon Bellish</b></sub></a><br /><a href="https://github.com/skyra-project/skyra/commits?author=PyroTechniac" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/Tylertron1998"><img src="https://avatars0.githubusercontent.com/u/34944514?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Tyler Davis</b></sub></a><br /><a href="https://github.com/skyra-project/skyra/commits?author=Tylertron1998" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/KunoichiZ"><img src="https://avatars1.githubusercontent.com/u/19984244?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Kaoru</b></sub></a><br /><a href="https://github.com/skyra-project/skyra/commits?author=KunoichiZ" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/superusercode"><img src="https://avatars0.githubusercontent.com/u/60588434?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Code.</b></sub></a><br /><a href="https://github.com/skyra-project/skyra/commits?author=superusercode" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/YorkAARGH"><img src="https://avatars1.githubusercontent.com/u/20838878?v=4?s=100" width="100px;" alt=""/><br /><sub><b>York</b></sub></a><br /><a href="https://github.com/skyra-project/skyra/commits?author=YorkAARGH" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/ImmortalSnake"><img src="https://avatars0.githubusercontent.com/u/47276574?v=4?s=100" width="100px;" alt=""/><br /><sub><b>ImmortalSnake</b></sub></a><br /><a href="https://github.com/skyra-project/skyra/commits?author=ImmortalSnake" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://skyra.pw/"><img src="https://avatars0.githubusercontent.com/u/61647701?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Skyra</b></sub></a><br /><a href="#infra-NM-EEA-Y" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    <td align="center"><a href="https://github.com/gc"><img src="https://avatars2.githubusercontent.com/u/30398469?v=4?s=100" width="100px;" alt=""/><br /><sub><b>GC</b></sub></a><br /><a href="https://github.com/skyra-project/skyra/commits?author=gc" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/Rexogamer"><img src="https://avatars0.githubusercontent.com/u/42586271?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ed L</b></sub></a><br /><a href="#translation-Rexogamer" title="Translation">🌍</a></td>
    <td align="center"><a href="https://github.com/Soumil07"><img src="https://avatars0.githubusercontent.com/u/29275227?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Soumil07</b></sub></a><br /><a href="https://github.com/skyra-project/skyra/commits?author=Soumil07" title="Code">💻</a> <a href="#translation-Soumil07" title="Translation">🌍</a> <a href="https://github.com/skyra-project/skyra/pulls?q=is%3Apr+reviewed-by%3ASoumil07" title="Reviewed Pull Requests">👀</a> <a href="#platform-Soumil07" title="Packaging/porting to new platform">📦</a> <a href="#maintenance-Soumil07" title="Maintenance">🚧</a> <a href="https://github.com/skyra-project/skyra/issues?q=author%3ASoumil07" title="Bug reports">🐛</a></td>
    <td align="center"><a href="http://www.adityatd.me/"><img src="https://avatars0.githubusercontent.com/u/9266227?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Aditya N. Tripathi</b></sub></a><br /><a href="https://github.com/skyra-project/skyra/commits?author=AdityaTD" title="Code">💻</a> <a href="https://github.com/skyra-project/skyra/issues?q=author%3AAdityaTD" title="Bug reports">🐛</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

<!----------------- LINKS --------------->

[`node.js`]: https://nodejs.org/en/download/current/
[`postgresql`]: https://www.postgresql.org/download/
[`lavalink`]: https://github.com/Frederikam/Lavalink
[`influxdb`]: https://v2.docs.influxdata.com/v2.0/get-started/
[`graphql-pokemon`]: https://github.com/favware/graphql-pokemon
[`saelem`]: https://github.com/skyra-project/saelem
[`redis`]: https://redis.io
[set-up - refer to contributing.md]: /.github/CONTRIBUTING.md
[evlyn]: https://github.com/kyranet/Evlyn
[glitch]: https://glitch.com/
[heroku]: https://www.heroku.com/
[netcup]: https://www.netcup.eu/
[digitalocean]: https://www.digitalocean.com/
[skyra invite link]: https://invite.skyra.pw
[support server]: https://join.skyra.pw
[patreon]: https://www.patreon.com/kyranet
[klasa's website]: https://klasa.js.org
[patreonimage]: https://cdn.skyra.pw/gh-assets/patreon.png
[paypalimage]: https://cdn.skyra.pw/gh-assets/paypal.png
[bitcoinimage]: https://cdn.skyra.pw/gh-assets/bitcoin.png
[ethereumimage]: https://cdn.skyra.pw/gh-assets/ethereum.png
[litecoinimage]: https://cdn.skyra.pw/gh-assets/litecoin.png
