import {OnClickEvent} from '@playkit-js/common/dist/hoc/a11y-wrapper';
import {ItemTypes} from '../../src/types/timelineTypes';

export type CuePointOptionsObject = {
  marker?: MarkerOptionsObject;
  preview?: PreviewOptionsObject;
};

export type TimedCuePointOptionsObject = CuePointOptionsObject & {
  time: number;
  presets?: Array<string>;
};

export type KalturaCuePointOptionsObject = {
  startTime: number;
  type: string;
  cuePointId: string;
  title?: string;
  cuePointData?: QuizQuestionData;
};

export type QuizQuestionData = {
  onClick: () => void;
  isMarkerDisabled: () => boolean;
  index: number;
  type: number;
};

export type NavigationChapterData = {
  onClick?: (
    e: OnClickEvent,
    byKeyboard: boolean,
    cuePoint: {startTime: number; type: ItemTypes.Chapter; cuePointId: string; title?: string}
  ) => void;
};

export type MarkerOptionsObject = {
  get?: Function | string;
  props?: Object;
  color?: string;
  width?: number;
  className?: string;
};

export type PreviewOptionsObject = {
  get?: Function | string;
  props?: Object;
  width?: number;
  height?: number;
  className?: string;
  hideTime?: boolean;
  sticky?: boolean;
};

export type TimelineMarkerDataObject = MarkerOptionsObject & {
  id?: string;
  timelinePreviewRef: any;
  timelineMarkerRef: any;
  cuePointsData: Array<CuePointMarker>;
  useQuizQuestionMarkerSize: boolean;
  onMarkerClick: any;
  isMarkerDisabled: any;
  onPreviewClick: (e: OnClickEvent, byKeyboard: boolean) => void;
};

export type CuePointMarker = {
  id: string;
  type: string;
  title: string;
  cuePointData: any;
};

export type Chapter = {
  id: string;
  type: ItemTypes.Chapter;
  title: string;
  startTime: number;
  endTime: number;
  isDummy?: boolean;
  isHovered: boolean;
  onPreviewClick: (e: OnClickEvent, byKeyboard: boolean) => void;
};
