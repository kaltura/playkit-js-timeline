//@flow
import * as KalturaPlayer from 'kaltura-player-js';
import {CuePoint} from './components/cue-point';

const {preact, redux, reducers, style} = KalturaPlayer.ui;
const {actions} = reducers.seekbar;

/**
 * @class TimelineManager
 */
class TimelineManager {
  static _logger: any;
  _uiManager: any;
  _logger: any;
  _store: any;
  _cuePointsRemoveMap: {[id: string]: Function};
  _counter: number;

  /**
   * @constructor
   * @param {Player} player - the player
   * @param {any} logger - the logger
   */
  constructor(player: Player, logger: any) {
    this._uiManager = player.ui;
    this._logger = logger;
    this._store = redux.useStore();
    this._cuePointsRemoveMap = {};
    this._counter = 0;
  }

  /**
   * @param {CuePointOptionsObject} newCuePoint - The cue point options
   * @return {null|{id: string}} - An object contains the cue point id
   */
  addCuePoint(newCuePoint: CuePointOptionsObject = {}): {id: string} | null {
    if (this._store.getState().engine.isLive) {
      this._logger.warn('Impossible to add cue points while LIVE playback');
      return null;
    }
    if (typeof newCuePoint.time !== 'number') {
      this._logger.warn('Cue point time is missing');
      return null;
    }
    const id = (this._counter++).toString();
    this._cuePointsRemoveMap[id] = this._uiManager.addComponent({
      label: `Cue Point - ${id}`,
      presets: newCuePoint.presets || [this._store.getState().shell.activePresetName],
      area: 'SeekBar',
      get: CuePoint,
      props: {
        time: newCuePoint.time,
        marker: newCuePoint.marker || {},
        preview: newCuePoint.preview || {}
      }
    });
    return {id};
  }

  /**
   * @param {{id: string}} cuePoint - An object contains the cue point id
   * @returns {void}
   */
  removeCuePoint(cuePoint: {id: string}): void {
    const {id} = cuePoint;
    if (typeof this._cuePointsRemoveMap[id] === 'function') {
      this._cuePointsRemoveMap[id]();
    }
  }

  /**
   * @param {SeekbarPreviewOptionsObject} preview - The seekbar preview options
   * @return {Function} - Removal function
   */
  setSeekbarPreview(preview: SeekbarPreviewOptionsObject = {}): Function {
    const presets = preview.presets || [this._store.getState().shell.activePresetName];
    const previewStyle = {
      width: `${preview.width || style.framePreviewImgWidth}px`,
      height: `${preview.height || style.framePreviewImgHeight}px`
    };
    const removePreview = this._uiManager.addComponent({
      label: 'SeekBar Preview',
      presets,
      area: 'SeekBar',
      get: preview.get
        ? props => {
            const previewProps: Object = {
              ...preview.props,
              className: preview.className,
              style: preview.props ? {...previewStyle, ...preview.props.style} : previewStyle
            };
            typeof preview.get !== 'string' && (previewProps.defaultPreviewProps = props.replacedComponentProps);
            return (
              <div
                className={preview.sticky === false ? style.nonSticky : undefined}
                onMouseOver={() => {
                  this._store.dispatch(actions.updateSeekbarPreviewHoverActive(true));
                }}
                onMouseLeave={() => {
                  this._store.dispatch(actions.updateSeekbarPreviewHoverActive(false));
                }}>
                {preact.h(preview.get, previewProps)}
              </div>
            );
          }
        : undefined,
      replaceComponent: 'SeekBarPreview'
    });
    this._store.dispatch(actions.updateHideTimeBubble(false));
    if (preview.hideTime) {
      this._store.dispatch(actions.updateHideTimeBubble(true));
    }
    return () => {
      removePreview();
      this._store.dispatch(actions.updateHideTimeBubble(false));
    };
  }

  /**
   * @returns {void}
   */
  reset() {
    this._removeAllCuePoints();
  }

  /**
   * @returns {void}
   */
  destroy() {
    this._removeAllCuePoints();
  }

  /**
   * @returns {void}
   */
  _removeAllCuePoints() {
    Object.values(this._cuePointsRemoveMap).forEach((func: Function) => func());
  }
}

export {TimelineManager};
