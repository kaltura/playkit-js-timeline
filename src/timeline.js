// @flow
import {BasePlugin, ui, core} from 'kaltura-player-js';
import {TimelineManager} from './timeline-manager';
import {cssVarsSupported} from 'css-vars-support';

declare var cssVars;

const {style} = ui;
const {Utils} = core;

const CSS_VARS_POLYFILL_CDN_URL = 'https://cdn.jsdelivr.net/npm/css-vars-ponyfill';
let cssVarsPolyfillLibLoaded: ?Promise<*> = null;

/**
 * Timeline class.
 * @classdesc
 */
class Timeline extends BasePlugin {
  /**
   * @static
   * @public
   * @returns {boolean} - Whether the plugin is valid.
   */
  static isValid(): boolean {
    return true;
  }

  /**
   * @constructor
   * @param {string} name - The plugin name.
   * @param {Player} player - The player instance.
   * @param {Object} config - The plugin config.
   */
  constructor(name: string, player: Player, config: Object) {
    super(name, player, config);
    this.player.ui.registerManager('timeline', new TimelineManager(this.player, this.logger));
  }

  get ready(): Promise<*> {
    if (!cssVarsSupported()) {
      if (!cssVarsPolyfillLibLoaded) {
        cssVarsPolyfillLibLoaded = Utils.Dom.loadScriptAsync(CSS_VARS_POLYFILL_CDN_URL)
          .then(() => {
            cssVars({
              variables: {
                white: style.white,
                'progress-bar-height': style.progressBarHeight,
                'progress-bar-border-radius': style.progressBarBorderRadius
              }
            });
          })
          .catch(() => {
            this.logger.warn(`Failed to load css-vars-ponyfill lib from ${CSS_VARS_POLYFILL_CDN_URL}`);
          });
      }
      return cssVarsPolyfillLibLoaded;
    }
    return Promise.resolve();
  }
}

export {Timeline};
