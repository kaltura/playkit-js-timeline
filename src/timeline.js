// @flow
import {BasePlugin, ui} from 'kaltura-player-js';
import {TimelineManager} from './timeline-manager';
import cssVars from 'css-vars-ponyfill';

const {style} = ui;

/**
 * Timeline class.
 * @classdesc
 */
class Timeline extends BasePlugin {
  /**
   * The default configuration of the plugin.
   * @type {Object}
   * @static
   */
  static defaultConfig: Object = {};

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
    cssVars({
      variables: {
        white: style.white,
        'progress-bar-height': style.progressBarHeight,
        'progress-bar-border-radius': style.progressBarBorderRadius
      }
    });
    // move this line to plugin ready
    this.eventManager.listen(this.player, this.player.Event.SOURCE_SELECTED, e => this._onSourceSelected());
    this.eventManager.listen(this.player, this.player.Event.AD_MANIFEST_LOADED, e => this._onAdManifestLoaded(e));
  }

  _onSourceSelected(): void {
    this.player.ui.registerManager('timeline', new TimelineManager(this.player, this.logger));
  }

  _onAdManifestLoaded(e: any): void {
    const cuePoints = e.payload.adBreaksPosition;
    cuePoints.forEach(cuePoint => {
      this.player.ui.getManager('timeline').addCuePoint({
        time: cuePoint !== -1 ? cuePoint : Infinity
      });
    });
  }
}

export {Timeline};
