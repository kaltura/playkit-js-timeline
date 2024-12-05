import {h, createRef, VNode} from 'preact';
import * as KalturaPlayer from '@playkit-js/kaltura-player-js';
import {OnClickEvent} from '@playkit-js/common/dist/hoc/a11y-wrapper';
// @ts-ignore
import {CuePoint} from './components/cue-point';
import {TimelineMarker} from './components/marker/timeline-marker';
import {
  Chapter,
  NavigationChapterData,
  QuizQuestionData,
  TimedCuePointOptionsObject,
  TimelineMarkerDataObject
} from '../flow-typed/types/cue-point-option';
import {SeekbarPreviewOptionsObject} from '../flow-typed/types/seekbar-preview-option';
import {ThumbnailInfo, TimeLineMarker, TimelineMarkerProps, ItemTypes} from './types/timelineTypes';
import {TimelinePreview} from './components/marker/timeline-preview';
// @ts-ignore
import {SegmentsWrapper} from './components/chapters';
import {getTimeInText} from './utils';

// @ts-ignore
const {core, ui} = KalturaPlayer;
const {EngineType} = core;
const {preact, redux, reducers, style, components} = ui;
const {PLAYER_SIZE, ProgressIndicator, SeekBarPreview} = components;
const {actions} = reducers.seekbar;

const KalturaPlayerSeekBarSelector = '.playkit-seek-bar';
const chaptersClassName = 'playkit-chapters';

/**
 * @class TimelineManager
 */
class TimelineManager {
  _store: any;
  _cuePointsRemoveMap: Map<string, Function>;
  _cuePointsMap: Map<number, TimelineMarkerDataObject>;
  _chapters: Chapter[] = [];
  _resolveTimelineDurationPromise = () => {};
  _timelineDurationPromise: Promise<void>;
  _getThumbnailInfoFn: (virtualTime: number) => ThumbnailInfo | Array<ThumbnailInfo>;

  /**
   * @constructor
   * @param _player
   * @param _logger
   * @param _eventManager
   */
  constructor(private _player: KalturaPlayerTypes.Player, private _logger: any, private _eventManager: any) {
    this._store = redux.useStore();
    this._cuePointsRemoveMap = new Map();
    this._cuePointsMap = new Map();
    this._timelineDurationPromise = this._makeTimelineDurationPromise();
    this._getThumbnailInfoFn = this._player.getThumbnail.bind(this._player);
  }

  get _uiManager() {
    return this._player.ui;
  }
  get _state(): any {
    return this._store.getState();
  }

  public get timelineManagerAPI() {
    return {
      loadMedia: this.loadMedia,
      addKalturaCuePoint: this.addKalturaCuePoint,
      removeAllKalturaCuePoints: this._removeAllCuePoints,
      addCuePoint: this.addCuePoint,
      removeCuePoint: this.removeCuePoint,
      setSeekbarPreview: this.setSeekbarPreview,
      setGetThumbnailInfo: (fn: (virtualTime: number) => ThumbnailInfo | Array<ThumbnailInfo>) => {
        this._addSeekBarPreview();
        this._getThumbnailInfoFn = fn;
      },
      addSeekBarPreview: this._addSeekBarPreview
    };
  }

  public loadMedia = () => {
    this._listenerDuration();
  };

  private _makeTimelineDurationPromise = () => {
    return new Promise<void>(res => {
      this._resolveTimelineDurationPromise = res;
    });
  };

  private _seekTo = () => {
    this._player.currentTime = this._state.seekbar.virtualTime;
  };

  private _handleChapter = (chapter: Chapter) => {
    if (this._chapters.length > 0) {
      // set the previous chapter's endTime to be the current chapter's startTime
      this._chapters[this._chapters.length - 1].endTime = chapter.startTime;
    }
    this._chapters.push(chapter);

    // add segement to seekbar
    const progressBarEl = this._getProgressBarEl();
    if (progressBarEl && !progressBarEl.classList.contains(style.chapters)) {
      progressBarEl.classList.add(chaptersClassName);
    }

    this._store.dispatch(actions.updateSeekbarSegments(this._chapters));
    this._uiManager.addComponent({
      label: 'Seekbar segment',
      presets: [this._state.shell.activePresetName],
      area: 'SeekBar',
      replaceComponent: 'ProgressIndicator',
      get: SegmentsWrapper
    });
    this._addSeekBarPreview(false, chapter.onPreviewClick);
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
    if (this._player.engineType === EngineType.YOUTUBE) {
      return Math.ceil(this._state.engine.duration) === duration;
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

  private _getProgressBarEl() {
    return document.getElementsByClassName(style.progressBar)[0];
  }

  private _restoreProgressIndicator() {
    const progressBarEl = this._getProgressBarEl();
    if (progressBarEl?.classList.contains(style.chapters)) {
      progressBarEl.classList.remove(chaptersClassName);
    }
    this._uiManager.addComponent({
      label: 'ProgressIndicator',
      presets: [this._state.shell.activePresetName],
      area: 'SeekBar',
      replaceComponent: 'ProgressIndicator',
      get: ProgressIndicator
    });
  }

  private _addSeekBarPreview = (moveOnHover: boolean = true, onPreviewClick: (e: OnClickEvent, byKeyboard: boolean) => void = this._seekTo) => {
    // replace the default seekbar frame preview with timeline preview
    this._uiManager.addComponent({
      label: 'Chapter preview',
      presets: [this._state.shell.activePresetName],
      area: 'SeekBar',
      replaceComponent: 'SeekBarPreview',
      get: () => (
        <TimelinePreview
          moveOnHover={moveOnHover}
          onPreviewClick={onPreviewClick}
          seekTo={this._seekTo}
          cuePointsData={[]}
          getThumbnailInfo={() => this._getThumbnailInfo(this._state.seekbar.virtualTime)}
          getSeekBarNode={this._getSeekBarNode}
        />
      )
    });
  };

  private _restoreSeekBarPreview = () => {
    this._uiManager.addComponent({
      label: 'SeekBarPreview',
      presets: [this._state.shell.activePresetName],
      area: 'SeekBar',
      replaceComponent: 'SeekBarPreview',
      get: SeekBarPreview
    });
  };

  public addKalturaCuePoint = (
    startTime: number,
    type: string,
    cuePointId: string,
    title?: string,
    cuePointData?: QuizQuestionData | NavigationChapterData | any
  ) => {
    if (this._state.shell.playerSize === PLAYER_SIZE.TINY || this._uiManager.store.getState().seekbar.isPreventSeek) {
      return;
    }
    // wait for the duration to be correct and stable
    this._timelineDurationPromise.then(() => {
      if (type === ItemTypes.Chapter) {
        const chapter: Chapter = {
          type: ItemTypes.Chapter,
          id: cuePointId,
          startTime: startTime,
          title: title!,
          endTime: this._state.engine.duration,
          isHovered: false,
          isDummy: false,
          onPreviewClick: (e: OnClickEvent, byKeyboard: boolean) => {
            cuePointData?.onClick?.({e, byKeyboard, cuePoint: chapter});
          }
        };
        this._handleChapter(chapter);
        return;
      }

      const cuePoint = {
        id: cuePointId,
        type: type,
        title: title || '',
        cuePointData: cuePointData ?? null
      };
      const timelineCuePoint = this._cuePointsMap.get(startTime);
      if (!timelineCuePoint) {
        // create the timeline marker data
        const timelineMarkerData: TimelineMarkerDataObject = {
          cuePointsData: [cuePoint],
          timelinePreviewRef: createRef(),
          timelineMarkerRef: createRef(),
          useQuizQuestionMarkerSize: type === ItemTypes.QuizQuestion,
          onMarkerClick: cuePointData?.onClick ?? this._seekTo,
          onPreviewClick: (e: OnClickEvent, byKeyboard: boolean) => {
            cuePointData?.onClick?.({e, byKeyboard, cuePoint}) ?? this._seekTo();
          },
          isMarkerDisabled: cuePointData?.isMarkerDisabled ?? false
        };
        this._cuePointsMap.set(startTime, timelineMarkerData);
        this._createKalturaCuePoint(timelineMarkerData, startTime);
      } else {
        // update data and components
        timelineCuePoint.cuePointsData.push(cuePoint);
        timelineCuePoint.useQuizQuestionMarkerSize = type === ItemTypes.QuizQuestion;
        if (type === ItemTypes.QuizQuestion) {
          timelineCuePoint.onMarkerClick = cuePointData!.onClick;
        }
        timelineCuePoint.timelinePreviewRef?.current?.forceUpdate();
        timelineCuePoint.timelineMarkerRef?.current?.forceUpdate();
      }
    });
  };

  private _createKalturaCuePoint = (timelineMarkerData: TimelineMarkerDataObject, markerStartTime: number) => {
    const setMarkerRef = (node: HTMLDivElement | null) => {
      timelineMarkerData.timelineMarkerRef = node;
    };
    const getTimelineMarkerType = () => {
      return timelineMarkerData?.cuePointsData?.[0]?.type;
    };
    // create the timeline marker comp
    const timeLineMarker: TimeLineMarker = {
      time: markerStartTime,
      marker: {
        width: 124,
        height: 32,
        get: (props: TimelineMarkerProps): VNode => {
          return (
            <TimelineMarker
              {...props}
              getSeekBarNode={this._getSeekBarNode}
              onMarkerClick={timelineMarkerData.onMarkerClick}
              useQuizQuestionMarkerSize={timelineMarkerData.useQuizQuestionMarkerSize}
              isDisabled={timelineMarkerData.isMarkerDisabled}
              setMarkerRef={setMarkerRef}
              markerStartTime={markerStartTime}
              type={getTimelineMarkerType()}
              startTimeInText={getTimeInText(markerStartTime, this._player?.config?.ui)}
            />
          ) as VNode;
        }
      }
    };
    if (this._player.sources?.type !== core.MediaType.AUDIO) {
      timeLineMarker.preview = {
        get: (): VNode => {
          return (
            <TimelinePreview
              ref={timelineMarkerData.timelinePreviewRef}
              seekTo={this._seekTo}
              onPreviewClick={timelineMarkerData.onPreviewClick}
              cuePointsData={timelineMarkerData.cuePointsData}
              getThumbnailInfo={() => this._getThumbnailInfo(markerStartTime)}
              markerStartTime={markerStartTime}
              getSeekBarNode={this._getSeekBarNode}
            />
          ) as VNode;
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
  public addCuePoint = (newCuePoint: TimedCuePointOptionsObject): {id: string} | null => {
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
  };

  /**
   * @param {{id: string}} cuePoint - An object contains the cue point id
   * @returns {void}
   */
  public removeCuePoint = (cuePoint: {id: string}): void => {
    const {id} = cuePoint;
    const fn = this._cuePointsRemoveMap.get(id);
    if (typeof fn === 'function') {
      fn();
      this._cuePointsRemoveMap.delete(id);
    }
  };

  /**
   * @param {SeekbarPreviewOptionsObject} preview - The seekbar preview options
   * @return {Function} - Removal function
   */
  setSeekbarPreview = (preview: SeekbarPreviewOptionsObject = {}): Function => {
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
  };

  /**
   * @returns {void}
   */
  reset() {
    this._removeAllCuePoints();
    this._eventManager.removeAll();
    this._timelineDurationPromise = this._makeTimelineDurationPromise();
  }

  /**
   * @returns {void}
   */
  destroy() {
    this.reset();
  }

  private _removeAllCuePoints = () => {
    this._cuePointsRemoveMap.forEach((fn, key) => {
      this.removeCuePoint({id: key});
    });
    this._cuePointsMap = new Map();

    this._restoreProgressIndicator();
    this._restoreSeekBarPreview();
    if (this._chapters.length) {
      this._store.dispatch(actions.updateSeekbarSegments([]));
      this._chapters = [];
    }
  };

  private _getThumbnailInfo(virtualTime: number): ThumbnailInfo | Array<ThumbnailInfo> {
    return this._getThumbnailInfoFn(virtualTime);
  }
}

export {TimelineManager};
