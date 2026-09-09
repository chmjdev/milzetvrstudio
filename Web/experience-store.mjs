import {readField,writeField} from './workspace-store.mjs';
export const readExperience=()=>readField('experience');
export const writeExperience=value=>writeField('experience',value);
