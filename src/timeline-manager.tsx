import {h, createRef} from 'preact';
import * as KalturaPlayer from '@playkit-js/kaltura-player-js';
// @ts-ignore
import {CuePoint} from './components/cue-point';
import {TimelineMarker} from './components/marker/timeline-marker';
import {Chapter, QuizQuestionData, TimedCuePointOptionsObject, TimelineMarkerDataObject} from '../flow-typed/types/cue-point-option';
import {SeekbarPreviewOptionsObject} from '../flow-typed/types/seekbar-preview-option';
import {ThumbnailInfo, TimeLineMarker, TimelineMarkerProps} from './types/timelineTypes';
import {TimelinePreview} from './components/marker/timeline-preview';
// @ts-ignore
import {SegmentsWrapper} from './components/chapters';
import {OnClickEvent} from '@playkit-js/common/dist/hoc/a11y-wrapper';
// @ts-ignore
const {preact, redux, reducers, style, components} = KalturaPlayer.ui;
const {PLAYER_SIZE} = components;
// @ts-ignore
const {actions} = reducers.seekbar;
// @ts-ignore
const {core} = KalturaPlayer;
const KalturaPlayerSeekBarSelector = '.playkit-seek-bar';
const quizQuestionType = 'QuizQuestion';
const chapterType = 'Chapter';
const chaptersClassName = 'playkit-chapters';

/**
 * @class TimelineManager
 */
class TimelineManager {
  _uiManager: any;
  _store: any;
  _cuePointsRemoveMap: Map<string, Function>;
  _cuePointsMap: Map<number, TimelineMarkerDataObject>;
  _chapters: Chapter[] = [];
  _resolveTimelineDurationPromise = () => {};
  _timelineDurationPromise: Promise<void>;

  /**
   * @constructor
   * @param _player
   * @param _logger
   * @param _dispatchTimelineEvent
   * @param _eventManager
   */
  constructor(
    private _player: KalturaPlayerTypes.Player,
    private _logger: any,
    private _dispatchTimelineEvent: (event: string, payload: any) => void,
    private _eventManager: any
  ) {
    this._uiManager = this._player.ui;
    this._store = redux.useStore();
    this._cuePointsRemoveMap = new Map();
    this._cuePointsMap = new Map();
    this._player.ready().then(() => {
      if (this.dualScreenPlugin) {
        this._addSeekBarPreview();
      }
    });
    this._timelineDurationPromise = this._makeTimelineDurationPromise();
  }

  get _state(): any {
    return this._store.getState();
  }

  public loadMedia = () => {
    this._listenerDuration();
  };

  private _makeTimelineDurationPromise = () => {
    return new Promise<void>(res => {
      this._resolveTimelineDurationPromise = res;
    });
  };

  get navigationPlugin() {
    return this._player.getService('navigation') as any;
  }

  get dualScreenPlugin() {
    return this._player.getService('dualScreen') as any;
  }

  private _isNavigationPluginVisible = () => {
    if (!this.navigationPlugin) {
      this._logger.warn("navigationPlugin haven't registered");
      return false;
    }
    return this.navigationPlugin.isVisible();
  };

  private _seekTo = (time: number) => {
    this._player.currentTime = time;
  };

  private _handleChapter = (chapter: Chapter) => {
    if (this._chapters.length > 0) {
      // set the previous chapter's endTime to be the current chapter's startTime
      this._chapters[this._chapters.length - 1].endTime = chapter.startTime;
    }
    this._chapters.push(chapter);
    this._addSegmentToSeekbar();
  };

  private _isDurationCorrect = () => {
    // @ts-ignore
    const {clipTo, seekFrom} = this._player.sources;
    let duration = this._player.sources.duration;
    if (clipTo && typeof seekFrom === 'number') {
      duration = clipTo - seekFrom;
    } else if (!clipTo && seekFrom && duration) {
      duration = duration - seekFrom;
    }
    return Math.round(this._state.engine.duration) === duration;
  };

  private _listenerDuration = () => {
    this._eventManager.listenOnce(this._player, this._player.Event.DURATION_CHANGE, () => {
      if (this._isDurationCorrect()) {
        this._resolveTimelineDurationPromise();
      } else {
        this._listenerDuration();
      }
    });
  };

  private _toggleNavigationPlugin = (e: OnClickEvent, byKeyboard: boolean | undefined, cuePointType: string) => {
    if (this._isNavigationPluginVisible()) {
      // focus to tab in navigation according to the type
      this._dispatchTimelineEvent('TimelinePreviewArrowClicked', {e, byKeyboard, cuePointType});
    }
  };

  private _getProgressBarEl() {
    return document.getElementsByClassName(style.progressBar)[0];
  }

  private _addSegmentToSeekbar() {
    const progressBarEl = this._getProgressBarEl();
    if (progressBarEl && !progressBarEl.classList.contains(style.chapters)) {
      progressBarEl.classList.add(chaptersClassName);
    }

    this._store.dispatch(actions.updateSeekbarSegments(this._chapters));
    this._player.ui.addComponent({
      label: 'Seekbar segment',
      presets: [this._state.shell.activePresetName],
      area: 'SeekBar',
      replaceComponent: 'ProgressIndicator',
      get: SegmentsWrapper
    });
    this._addSeekBarPreview(false);
  }

  private _restoreProgressIndicator() {
    const progressBarEl = this._getProgressBarEl();
    if (progressBarEl?.classList.contains(style.chapters)) {
      progressBarEl.classList.remove(chaptersClassName);
    }
    this._player.ui.addComponent({
      label: 'ProgressIndicator',
      presets: [this._state.shell.activePresetName],
      area: 'SeekBar',
      replaceComponent: 'ProgressIndicator',
      get: components.ProgressIndicator
    });
  }

  private _addSeekBarPreview = (moveOnHover: boolean = true) => {
    // replace the default seekbar frame preview with timeline preview
    this._player.ui.addComponent({
      label: 'Chapter preview',
      presets: [this._state.shell.activePresetName],
      area: 'SeekBar',
      replaceComponent: 'SeekBarPreview',
      get: () => (
        <TimelinePreview
          moveOnHover={moveOnHover}
          toggleNavigationPlugin={this._toggleNavigationPlugin}
          seekTo={this._seekTo}
          cuePointsData={[]}
          thumbnailInfo={() => this._getThumbnailInfo(this._state.seekbar.virtualTime)}
          getSeekBarNode={this._getSeekBarNode}
        />
      )
    });
  };

  private _restoreSeekBarPreview = () => {
    this._player.ui.addComponent({
      label: 'SeekBarPreview',
      presets: [this._state.shell.activePresetName],
      area: 'SeekBar',
      replaceComponent: 'SeekBarPreview',
      get: components.SeekBarPreview
    });
  };

  addKalturaCuePoint(startTime: number, type: string, cuePointId: string, title?: string, quizQuestionData?: QuizQuestionData) {
    if (this._state.shell.playerSize === PLAYER_SIZE.TINY || this._player.ui.store.getState().seekbar.isPreventSeek) {
      return;
    }
    // wait for the duration to be correct and stable
    this._timelineDurationPromise.then(() => {
      if (type === chapterType) {
        const chapter: Chapter = {
          id: cuePointId,
          startTime: startTime,
          title: title!,
          endTime: this._state.engine.duration,
          isHovered: false,
          isDummy: false
        };
        this._handleChapter(chapter);
        return;
      }
      const timelineCuePoint = this._cuePointsMap.get(startTime);
      if (!timelineCuePoint) {
        // create the timeline marker data
        const timelineMarkerData: TimelineMarkerDataObject = {
          cuePoints: [cuePointId],
          cuePointsData: [{id: cuePointId, type: type, title: title || '', quizQuestionData: quizQuestionData ?? null}],
          timelinePreviewRef: createRef(),
          timelineMarkerRef: createRef(),
          useQuizQuestionMarkerSize: type === quizQuestionType,
          onMarkerClick: quizQuestionData?.onClick ?? this._seekTo,
          isMarkerDisabled: quizQuestionData?.isMarkerDisabled ?? false
        };
        this._createKalturaCuePoint(timelineMarkerData, startTime);
        this._cuePointsMap.set(startTime, timelineMarkerData);
      } else {
        // update data and components
        timelineCuePoint.cuePoints.push(cuePointId);
        timelineCuePoint.cuePointsData.push({id: cuePointId, type: type, title: title || '', quizQuestionData: quizQuestionData ?? null});
        timelineCuePoint.useQuizQuestionMarkerSize = type === quizQuestionType;
        if (type === quizQuestionType) {
          timelineCuePoint.onMarkerClick = quizQuestionData!.onClick;
        }
        timelineCuePoint.timelinePreviewRef?.current?.forceUpdate();
        timelineCuePoint.timelineMarkerRef?.current?.forceUpdate();
      }
    });
  }

  private _createKalturaCuePoint = (timelineMarkerData: TimelineMarkerDataObject, markerStartTime: number) => {
    const setMarkerRef = (node: HTMLDivElement | null) => {
      timelineMarkerData.timelineMarkerRef = node;
    };
    // create the timeline marker comp
    const timeLineMarker: TimeLineMarker = {
      time: markerStartTime,
      marker: {
        width: 124,
        height: 32,
        get: (props: TimelineMarkerProps) => {
          return (
            <TimelineMarker
              {...props}
              getSeekBarNode={this._getSeekBarNode}
              onMarkerClick={timelineMarkerData.onMarkerClick}
              useQuizQuestionMarkerSize={timelineMarkerData.useQuizQuestionMarkerSize}
              isDisabled={timelineMarkerData.isMarkerDisabled}
              setMarkerRef={setMarkerRef}
              markerStartTime={markerStartTime}
            />
          );
        }
      }
    };
    if (this._player.sources?.type !== core.MediaType.AUDIO) {
      timeLineMarker.preview = {
        get: () => {
          return (
            <TimelinePreview
              ref={timelineMarkerData.timelinePreviewRef}
              seekTo={this._seekTo}
              toggleNavigationPlugin={this._toggleNavigationPlugin}
              cuePointsData={timelineMarkerData.cuePointsData}
              thumbnailInfo={() => this._getThumbnailInfo(markerStartTime)}
              markerStartTime={markerStartTime}
              getSeekBarNode={this._getSeekBarNode}
            />
          );
        },
        props: {
          style: {paddingTop: '33%'}
        },
        className: 'preview',
        width: this._player.getThumbnail(0)?.width,
        hideTime: false,
        sticky: true
      };
    }
    timelineMarkerData.id = this.addCuePoint(timeLineMarker)?.id;
  };

  private _getSeekBarNode = (): HTMLElement | null => {
    return this._player.getView().parentNode?.parentNode?.querySelector(KalturaPlayerSeekBarSelector) || null;
  };

  /**
   * @param {TimedCuePointOptionsObject} newCuePoint - The cue point options
   * @return {null|{id: string}} - An object contains the cue point id
   */
  addCuePoint(newCuePoint: TimedCuePointOptionsObject): {id: string} | null {
    if (this._state.engine.isLive) {
      this._logger.warn('Impossible to add cue points while LIVE playback');
      return null;
    }
    if (!(newCuePoint && typeof newCuePoint.time === 'number')) {
      this._logger.warn('Cue point time is missing');
      return null;
    }
    const id = this._cuePointsRemoveMap.size.toString();
    this._cuePointsRemoveMap.set(
      id,
      this._uiManager.addComponent({
        label: `Cue Point - ${id}`,
        presets: newCuePoint.presets || [this._state.shell.activePresetName],
        area: 'SeekBar',
        get: CuePoint,
        props: {
          time: newCuePoint.time,
          marker: newCuePoint.marker || {},
          preview: newCuePoint.preview || {}
        }
      })
    );
    return {id};
  }

  /**
   * @param {{id: string}} cuePoint - An object contains the cue point id
   * @returns {void}
   */
  removeCuePoint(cuePoint: {id: string}): void {
    const {id} = cuePoint;
    const fn = this._cuePointsRemoveMap.get(id);
    if (typeof fn === 'function') {
      fn();
    }
  }

  /**
   * @param {SeekbarPreviewOptionsObject} preview - The seekbar preview options
   * @return {Function} - Removal function
   */
  setSeekbarPreview(preview: SeekbarPreviewOptionsObject = {}): Function {
    const presets = preview.presets || [this._state.shell.activePresetName];
    const previewStyle = {
      width: `${preview.width || style.framePreviewImgWidth}px`,
      height: `${preview.height || style.framePreviewImgHeight}px`
    };
    const removePreview = this._uiManager.addComponent({
      label: 'SeekBar Preview',
      presets,
      area: 'SeekBar',
      get: preview.get
        ? (props: any) => {
            const previewProps = {
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
                {preact.h(preview.get as string, previewProps)}
              </div>
            );
          }
        : undefined,
      replaceComponent: 'SeekBarPreview'
    });
    this._store.dispatch(actions.updateHideSeekbarTimeBubble(false));
    if (preview.hideTime) {
      this._store.dispatch(actions.updateHideSeekbarTimeBubble(true));
    }
    return () => {
      removePreview();
      this._store.dispatch(actions.updateHideSeekbarTimeBubble(false));
    };
  }

  /**
   * @returns {void}
   */
  reset() {
    this._removeAllCuePoints();
    this._restoreProgressIndicator();
    this._restoreSeekBarPreview();
    this._cuePointsMap = new Map();
    if (this._chapters.length) {
      this._store.dispatch(actions.updateSeekbarSegments([]));
      this._chapters = [];
    }
    this._eventManager.removeAll();
    this._timelineDurationPromise = this._makeTimelineDurationPromise();
  }

  /**
   * @returns {void}
   */
  destroy() {
    this.reset();
  }

  /**
   * @returns {void}
   */
  _removeAllCuePoints() {
    this._cuePointsRemoveMap.forEach((fn, key) => {
      fn();
      this._cuePointsRemoveMap.delete(key);
    });
  }

  private _getThumbnailInfo(virtualTime: number): ThumbnailInfo | Array<ThumbnailInfo> {
    if (this.dualScreenPlugin) {
      return this.dualScreenPlugin.getDualScreenThumbs(virtualTime);
    }
    return this._player.getThumbnail(virtualTime);
  }
}

export {TimelineManager};
