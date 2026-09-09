import {readField,writeField} from './workspace-store.mjs';
export const loadRecovery=()=>readField('scene');
export const saveRecovery=value=>writeField('scene',value);
