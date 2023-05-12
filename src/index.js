// @flow
import {registerPlugin} from '@playkit-js/kaltura-player-js';
import {Timeline} from './timeline';

declare var __VERSION__: string;
declare var __NAME__: string;

const VERSION = __VERSION__;
const NAME = __NAME__;

export {Timeline as Plugin};
export {VERSION, NAME};

const pluginName: string = 'timeline';

registerPlugin(pluginName, Timeline);
