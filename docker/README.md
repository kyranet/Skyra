# Skyra Dockerfiles

This folder contains all the files required to control Docker development environments for Skyra. Most of the meat of
the content is in the `docker-compose.yml` file which has the info on which images can be build and as which containers
they would be ran. In order to easily control the docker-compose file there is a powershell, `control.ps1`.

Skyra currently has the following microservices that can be dockerized:

- PostgreSQL Database
  - Service name in docker-compose: `postgres`
  - Image used: `skyrabot/postgres:master`
  - For more information see [skyra-project/docker-images]
- Lavalink
  - Service name in docker-compose: `lavalink`
  - Image used: `skyrabot/lavalink:master`
  - For more information see [skyra-project/docker-images]
- GraphQL-Pokémon
  - Service name in docker-compose: `pokedex`
  - Image used: `favware/graphql-pokemon:master`
  - For more information see [favware/graphql-pokemon]
- Saelem
  - Service name in docker-compose: `saelem`
  - Image used: `skyrabot/saelem/saelem:master`
  - For more information see [skyra-project/saelem]
- InfluxDB
  - Service name in docker-compose: `influx`
  - Image used: `quay.io/influxdb/influxdb:2.0.0-beta`
  - For more information see [influxdb]
  - Additional instructions
    1. After starting the InfluxDB container go to [locahost:8285]
	1. Create a user to your liking, ensuring you take note of the Organization name and Initial bucket name, you need those for the next two steps
	    - The recommended value for Organization is: `Skyra-Project`
	    - The recommended value for Initial bucket name is: `analytics`
	1. In [the config file] set the value of `INFLUX_ORG` to the value of the Organization name
	1. In [the config file] set the value of `INFLUX_ORG_ANALYTICS_BUCKET` to the value of the Initial bucket name
	1. Once on the InfluxDB homepage click the "Data" tab on the left sidebar
	1. Open the "Tokens" tab in the new view
	1. Click on your token, which should be YourUsername's Token (YourUsername being what you entered before as the username)
	1. Click the "Copy to clipboard" button then paste set that value for `INFLUX_TOKEN` in [the config file]

<!-- Link dump -->

[skyra-project/docker-images]: https://github.com/skyra-project/docker-images
[favware/graphql-pokemon]:     https://github.com/favware/graphql-pokemon
[skyra-project/saelem]:        https://github.com/skyra-project/saelem
[influxdb]:                    https://v2.docs.influxdata.com/v2.0/get-started/#download-and-run-influxdb-v2-0-beta
[locahost:8285]:               http://localhost:8285
[the config file]:             ../src/config.ts