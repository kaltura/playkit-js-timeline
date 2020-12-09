// @flow
import {BasePlugin, ui, core} from 'kaltura-player-js';
import {TimelineManager} from './timeline-manager';

declare var cssVars;

const {style} = ui;
const {Env, Utils} = core;

const CSS_VARS_CDN_URL = 'https://cdn.jsdelivr.net/npm/css-vars-ponyfill';

/**
 * Timeline class.
 * @classdesc
 */
class Timeline extends BasePlugin {
  static _cssVarsLibRequested: boolean = false;
  /**
   * The default configuration of the plugin.
   * @type {Object}
   * @static
   */
  static defaultConfig: Object = {
    adBreakCuePoint: null
  };

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
    this.eventManager.listen(this.player, this.player.Event.AD_MANIFEST_LOADED, e => this._onAdManifestLoaded(e));
  }

  get ready(): Promise<*> {
    if (Env.browser.name === 'IE' && !Timeline._cssVarsLibRequested) {
      Timeline._cssVarsLibRequested = true;
      return Utils.Dom.loadScriptAsync(CSS_VARS_CDN_URL)
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
          this.logger.warn(`Failed to load css-vars-ponyfill lib from ${CSS_VARS_CDN_URL}`);
        });
    }
    return Promise.resolve();
  }

  _onAdManifestLoaded(e: any): void {
    const adBreaksPosition = e.payload.adBreaksPosition;
    if (this.config.adBreakCuePoint && adBreaksPosition) {
      adBreaksPosition.forEach(position => {
        this.player.ui.getManager('timeline').addCuePoint({
          time: position !== -1 ? position : Infinity,
          ...this.config.adBreakCuePoint
        });
      });
    }
  }
}

export {Timeline};
