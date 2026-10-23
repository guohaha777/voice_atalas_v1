// Background port for 万物成曲. The background music is generated (by code in model/backgroundSynth.ts today; later by
// the server from uploaded teaching music + the child's arrangement, see shared/inspiration/teachingMusic.ts) and
// instruments only change who plays it. Today: three example instruments synthesised in the browser
// (config/backgrounds). The background is always its own layer and can be switched off.
//
// Intended server endpoints (not implemented):
//   GET  /api/v1/instruments                           → Instrument[] (licensed, reviewed; more open over time)
//   POST /api/v1/works/{workId}/background             ← {musicId?,instruments,arrangement} → job → {backgroundUrl}
import type {MoodChoice} from '@wanwu-v2/contracts/arrangement';
import {presetMood} from '../../../shared/creation/moodCopy.ts';
import type {Rhythm} from '../../../shared/inspiration/catalog';
import {comingInstruments,moodRhythm as rhythms,mockInstruments} from '../config/backgrounds.ts';
import type {Instrument} from '../config/backgrounds.ts';

/** `example` = made in the browser for this demo, not a licensed library. `coming`: names shown as not open yet. */
export type InstrumentList={origin:'example'|'library';instruments:readonly Instrument[];coming:readonly string[]};

export type BackgroundLibrary={list():Promise<InstrumentList>};

export const mockBackgroundLibrary:BackgroundLibrary={
 async list(){return {origin:'example',instruments:mockInstruments,coming:comingInstruments};},
};

/** Rhythm for the generated background when no textbook rhythm is borrowed (a custom mood uses the nearest preset). */
export const moodRhythm=(mood:MoodChoice|null):Rhythm=>rhythms[presetMood(mood)??'none'];
