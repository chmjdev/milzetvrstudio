import {readField,writeField} from './workspace-store.mjs';
export const readLibrary=()=>readField('library');
export const writeLibrary=value=>writeField('library',value);
