// Mock instrument library for 万物成曲's background: three instruments synthesised in the browser (no audio files, no
// licence needed). An instrument only changes who plays the generated background music; with none chosen the music
// plays as generated. The child may pick any of them, several, or none. They stand in for the real library until the
// server provides licensed instruments through services/backgroundLibrary.ts; more are shown as "coming".
import type {MoodId} from '@wanwu-v2/contracts/arrangement';
import type {Rhythm} from '../../../shared/inspiration/catalog';

export type InstrumentRecipe='pad'|'bells'|'pulse';
export type Instrument={
 id:string;name:string;
 /** How it is made: `local-synth` is rendered in the browser from `recipe`; a server instrument will carry samples. */
 source:'local-synth';recipe:InstrumentRecipe;
};

export const mockInstruments:readonly Instrument[]=[
 {id:'inst:local:organ',name:'风琴',source:'local-synth',recipe:'pad'},
 {id:'inst:local:xylophone',name:'木琴',source:'local-synth',recipe:'bells'},
 {id:'inst:local:drum',name:'小鼓',source:'local-synth',recipe:'pulse'},
];
/** Names of instruments planned for later, shown greyed as 即将开放 (not playable). */
export const comingInstruments=['钢琴','笛子','沙锤'] as const;

/**
 * The rhythm of the generated background for the mood picked in 万物声场 — a fixed table, not a model. Used when no
 * textbook rhythm is borrowed. It never changes the child's sounds.
 */
export const moodRhythm:Record<MoodId|'none',Rhythm>={
 none:{tempo:76,metre:4},calm:{tempo:68,metre:4},sad:{tempo:60,metre:3},scared:{tempo:72,metre:3},
 happy:{tempo:100,metre:4},lively:{tempo:112,metre:2},curious:{tempo:88,metre:3},angry:{tempo:96,metre:4},
};
