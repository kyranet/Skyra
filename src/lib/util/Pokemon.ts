import { Query, Pokemon, Abilities, Items, Moves, Types } from '@favware/graphql-pokemon';
import { ENABLE_LOCAL_POKEDEX } from '../../../config';

const AbilityFragment = `
fragment ability on AbilityEntry {
    desc
    shortDesc
    name
    num
    bulbapediaPage
    serebiiPage
    smogonPage
}`;

const AbilitiesFragment = `
fragment abilities on AbilitiesEntry {
    first
    second
    hidden
    special
}`;

const StatsFragment = `
fragment stats on StatsEntry {
    hp
    attack
    defense
    specialattack
    specialdefense
    speed
}`;

const GendersFragment = `
fragment genders on GenderEntry {
  male
  female
}`;

const FlavorsFrament = `
fragment flavors on FlavorEntry {
  game
  flavor
}`;

const FlavorTextFragment = `
${FlavorsFrament}
fragment flavortexts on DexDetails {
    flavorTexts {
        ...flavors
    }
}`;

const DexDetailsFragment = `
${AbilitiesFragment}
${StatsFragment}
${GendersFragment}
${FlavorsFrament}

fragment dexdetails on DexDetails {
    num
    species
    types
    abilities {
        ...abilities
    }
    baseStats {
        ...stats
    }
    gender {
        ...genders
    }
    color
    eggGroups
    evolutionLevel
    height
    weight
    otherFormes
    sprite
    shinySprite
    smogonTier
    bulbapediaPage
    serebiiPage
    smogonPage
    flavorTexts {
        ...flavors
    }
}`;

const EvolutionsFragment = `
${DexDetailsFragment}

fragment evolutions on DexDetails {
    evolutions {
        ...dexdetails
        evolutions {
          ...dexdetails
        }
      }
      preevolutions {
        ...dexdetails
        preevolutions {
          ...dexdetails
        }
      }
}`;

const ItemsFragment = `
fragment items on ItemEntry {
    desc
    name
    bulbapediaPage
    serebiiPage
    smogonPage
    sprite
    isNonstandard
    generationIntroduced
}`;

const LearnsetLevelupMoveFragment = `
fragment learnsetLevelupMove on LearnsetLevelUpMove {
    name
    generation
    level
}`;

const LearnsetMoveFragment = `
fragment learnsetMove on LearnsetMove {
    name
    generation
}`;

const LearnsetFragment = `
${LearnsetLevelupMoveFragment}
${LearnsetMoveFragment}

fragment learnset on LearnsetEntry {
    levelUpMoves {
        ...learnsetLevelupMove
    }
    virtualTransferMoves {
        ...learnsetMove
    }
    tutorMoves {
        ...learnsetMove
    }
    tmMoves {
        ...learnsetMove
    }
    eggMoves {
        ...learnsetMove
    }
    eventMoves {
        ...learnsetMove
    }
    dreamworldMoves {
        ...learnsetMove
    }
}`;

const MoveFragment = `
fragment moves on MoveEntry {
    name
    shortDesc
    type
    basePower
    pp
    accuracy
    priority
    target
    contestType
    bulbapediaPage
    serebiiPage
    smogonPage
    category
}`;

const TypeEntryFragment = `
fragment typeEntry on TypeEntry {
    doubleEffectiveTypes
    effectiveTypes
    normalTypes
    resistedTypes
    doubleResistedTypes
    effectlessTypes
}`;

const TypeMatchupFragment = `
${TypeEntryFragment}

fragment typesMatchups on TypeMatchups {
    attacking {
      ...typeEntry
    }
    defending {
      ...typeEntry
    }
}`;

export const getPokemonDetailsByFuzzy = (pokemon: string | Pokemon) => `
${EvolutionsFragment}

{
    getPokemonDetailsByFuzzy(pokemon: \"${pokemon}\" skip: 0 take: 1 reverse: true) {
        ...dexdetails
        ...evolutions
    }
}`;

export const getPokemonFlavorTextsByFuzzy = (pokemon: string | Pokemon) => `
${FlavorTextFragment}
{
    getPokemonDetailsByFuzzy(pokemon: \"${pokemon}\" skip: 0 take: 12 reverse: true) {
        sprite
        num
        species
        color
        ...flavortexts
    }
}`;

export const getAbilityDetailsByFuzzy = (ability: string | Abilities) => `
${AbilityFragment}

{
    getAbilityDetailsByFuzzy(ability: \"${ability}\" skip: 0 take: 1) {
      ...ability
    }
}`;

export const getItemDetailsByFuzzy = (items: string | Items) => `
${ItemsFragment}

{
    getItemDetailsByFuzzy(item: \"${items}\" skip: 0 take: 1) {
        ...items
    }
}`;

export const getPokemonLearnset = (pokemon: Pokemon, moves: Moves[], generation?: PokemonGenerations) => `
${LearnsetFragment}

{
    getPokemonLearnset(pokemon: ${pokemon} moves: ${moves} generation: ${generation || 7}) {
      ...learnset
    }
}`;

export const getMoveDetailsByFuzzy = (move: string | Moves) => `
${MoveFragment}

{
    getMoveDetailsByFuzzy(move: \"${move}\" skip: 0 take: 1) {
        ...moves
    }
}`;

export const getTypeMatchup = (types: Types[]) => `
${TypeMatchupFragment}

{
    getMoveDetailsByFuzzy(types: ${types}) {
        ...typesMatchup
    }
}`;

/**
 * Parses a Bulbapedia-like URL to be properly embeddable on Discord
 * @param url URL to parse
 */
export const parseBulbapediaURL = (url: string) => url
	.replace(/[ ]/g, '_')
	.replace(/\(/g, '%28')
	.replace(/\)/g, '%29');

/** Parses PokéDex colours to Discord MessageEmbed colours */
export const resolveColour = (col: string) => {
	switch (col) {
		case 'Black':
			return 0x323232;
		case 'Blue':
			return 0x257CFF;
		case 'Brown':
			return 0xA3501A;
		case 'Gray':
			return 0x969696;
		case 'Green':
			return 0x3EFF4E;
		case 'Pink':
			return 0xFF65A5;
		case 'Purple':
			return 0xA63DE8;
		case 'Red':
			return 0xFF3232;
		case 'White':
			return 0xE1E1E1;
		case 'Yellow':
			return 0xFFF359;
		default:
			return 0xFF0000;
	}
};

export interface GraphQLPokemonResponse<K extends keyof Omit<Query, '__typename'>> {
	data: Record<K, Omit<Query[K], '__typename'>>;
}

export type PokemonGenerations = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const POKEMON_GRAPHQL_API_URL = ENABLE_LOCAL_POKEDEX ? 'http://localhost:4000' : 'https://favware.tech/api';
export const POKEMON_EMBED_THUMBNAIL = 'https://cdn.skyra.pw/img/pokemon/dex.png';
