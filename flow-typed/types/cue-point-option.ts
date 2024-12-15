export type CuePointOptionsObject = {
  marker?: MarkerOptionsObject,
  preview?: PreviewOptionsObject
};

export type TimedCuePointOptionsObject = CuePointOptionsObject & {
  time: number,
  presets?: Array<string>
};

export type KalturaCuePointOptionsObject = {
  startTime: number,
  type: string,
  cuePointId: string,
  title?: string,
  quizQuestionData?: QuizQuestionData
};

export type QuizQuestionData = {
  onClick: () => void,
  isMarkerDisabled: () => boolean,
  index: number,
  type: number
};

export type MarkerOptionsObject = {
  get?: Function | string,
  props?: Object,
  color?: string,
  width?: number,
  className?: string
};

export type PreviewOptionsObject = {
  get?: Function | string,
  props?: Object,
  width?: number,
  height?: number,
  className?: string,
  hideTime?: boolean,
  sticky?: boolean
};

export type TimelineMarkerDataObject = MarkerOptionsObject & {
  cuePoints: Array<string>,
  id?: string,
  timelinePreviewRef: any,
  timelineMarkerRef: any,
  cuePointsData: Array<CuePointMarker>,
  useQuizQuestionMarkerSize: boolean,
  onMarkerClick: any,
  isMarkerDisabled: any
};

export type CuePointMarker = {
  id: string,
  type: string,
  title: string,
  quizQuestionData: any
};

export type Chapter = {
  id: string,
  title: string,
  startTime: number,
  endTime: number,
  isDummy?: boolean,
  isHovered: boolean
};
