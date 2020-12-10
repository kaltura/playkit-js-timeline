// @flow

declare type CuePointOptionsObject = {
  marker?: MarkerOptionsObject,
  preview?: PreviewOptionsObject
};

declare type TimedCuePointOptionsObject = CuePointOptionsObject & {
  time: number,
  presets?: Array<string>
};

declare type MarkerOptionsObject = {
  get?: Function | string,
  props?: Object,
  color?: string,
  width?: number,
  className?: string
};

declare type PreviewOptionsObject = {
  get?: Function | string,
  props?: Object,
  width?: number,
  height?: number,
  className?: string,
  hideTime?: boolean,
  sticky?: boolean
};
