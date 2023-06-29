import {h, createRef} from 'preact';
import * as KalturaPlayer from '@playkit-js/kaltura-player-js';
// @ts-ignore
import {CuePoint} from './components/cue-point';
import {TimelineMarker} from './components/marker/timeline-marker';
import {
  Chapter,
  QuizQuestionData,
  TimedCuePointOptionsObject,
  TimelineMarkerDataObject
} from "../flow-typed/types/cue-point-option";
import {SeekbarPreviewOptionsObject} from "../flow-typed/types/seekbar-preview-option";
import {ThumbnailInfo, TimeLineMarker, TimelineMarkerProps} from "./types/timelineTypes";
import {TimelinePreview} from "./components/marker/timeline-preview";

const {preact, redux, reducers, style} = KalturaPlayer.ui;
// @ts-ignore
const {actions} = reducers.seekbar;
// @ts-ignore
const {core} = KalturaPlayer;
const KalturaPlayerSeekBarSelector = '.playkit-seek-bar';
const quizQuestionType = 'QuizQuestion';
const chapterType = 'Chapter';

/**
 * @class TimelineManager
 */
class TimelineManager {
  _uiManager: any;
  _store: any;
  _cuePointsRemoveMap: {[id: string]: Function};
  _counter: number;
  _cuePointsMap: Map<number, TimelineMarkerDataObject>;
  _chapters: Chapter[] = [];

  /**
   * @constructor
   * @param _player
   * @param _logger
   * @param _dispatchTimelineEvent
   */
  constructor(private _player: KalturaPlayerTypes.Player, private _logger: any, private _dispatchTimelineEvent: (event: string) => void) {
    this._uiManager = this._player.ui;
    this._store = redux.useStore();
    this._cuePointsRemoveMap = {};
    this._counter = 0;
    this._cuePointsMap = new Map();
  }

  private _isNavigationPluginOpen = () => {
    const navigationPlugin: any = this._player.getService('navigation');
    if (!navigationPlugin) {
      this._logger.warn("navigationPlugin haven't registered");
      return false;
    }
    return navigationPlugin.isPluginActive();
  };

  private _isNavigationPluginVisible = () => {
    const navigationPlugin: any = this._player.getService('navigation');
    if (!navigationPlugin) {
      this._logger.warn("navigationPlugin haven't registered");
      return false;
    }
    return navigationPlugin.isVisible();
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
    this._cuePointsMap.forEach((timelineCuePoint, markerStartTime) => {
      timelineCuePoint.chaptersData = [];
      this._chapters.forEach(chapter => {
        this._maybeAddChapterToMarker(timelineCuePoint, chapter, markerStartTime);
      });
    });
  };

  private _maybeAddChapterToMarker = (timelineCuePoint: TimelineMarkerDataObject, chapter: Chapter, markerStartTime: number) => {
    if (markerStartTime >= chapter.startTime && markerStartTime <= chapter.endTime) {
      timelineCuePoint.cuePoints.push(chapter.id);
      timelineCuePoint.chaptersData!.push({id: chapter.id, type: chapterType, title: chapter.title});
    }
  };

  private _toggleNavigationPlugin = () => {
    this._dispatchTimelineEvent('TimelinePreviewArrowClicked');
  };

  addKalturaCuePoint(startTime: number, type: string, cuePointId: string, title?: string, quizQuestionData?: QuizQuestionData) {
    if (type === chapterType) {
      const chapter = {
        id: cuePointId,
        startTime: startTime,
        title: title!,
        endTime: this._player.sources.duration!
      }
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
        chaptersData: [],
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
  }

  private _createKalturaCuePoint = (timelineMarkerData: TimelineMarkerDataObject, markerStartTime: number) => {
    // check if there is a matching chapter and add it to the marker's data
    this._chapters.forEach(chapter => {
      this._maybeAddChapterToMarker(timelineMarkerData, chapter, markerStartTime);
    });
    const setMarkerRef = (node: HTMLDivElement | null) => {
      timelineMarkerData.timelineMarkerRef = node;
    }
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
              onArrowClick={this._toggleNavigationPlugin}
              cuePointsData={timelineMarkerData.cuePointsData}
              chaptersData={timelineMarkerData.chaptersData}
              isNavigationPluginOpen={this._isNavigationPluginOpen}
              shouldRenderArrowButton={this._isNavigationPluginVisible}
              thumbnailInfo={this._getThumbnailInfo(markerStartTime)}
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
    if (this._store.getState().engine.isLive) {
      this._logger.warn('Impossible to add cue points while LIVE playback');
      return null;
    }
    if (!(newCuePoint && typeof newCuePoint.time === 'number')) {
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

  private _getThumbnailInfo(virtualTime: number): ThumbnailInfo {
    return this._player.getThumbnail(virtualTime);
  }
}

export {TimelineManager};
