import {VNode} from 'preact';

export interface DefaultPreviewProps {
  virtualTime: number;
}

export interface PreviewProps {
  defaultPreviewProps: DefaultPreviewProps;
}

export interface ThumbnailInfo {
  height: number;
  url: string;
  width: number;
  x: number;
  y: number;
  slide?: boolean;
}

export interface TimelineMarkerProps {
  className: string;
  style: Record<string, any>;
  onMarkerClick: (e: Event) => void;
  isDisabled: () => boolean | boolean;
  getSeekBarNode: () => Element | null;
  useQuizQuestionMarkerSize: boolean;
  setMarkerRef: (node: HTMLDivElement | null) => void;
  markerStartTime: number;
  type: string;
  startTimeInText: string;
  markerAriaLabel?: string;
}

export interface TimeLineMarker {
  marker: {
    get: (props: TimelineMarkerProps) => VNode;
    width?: number;
    height?: number;
  };
  time: number;
  preview?: {
    get: ({defaultPreviewProps}: PreviewProps) => VNode;
    props: {
      style: Record<string, string>;
    };
    className: string;
    width: number;
    hideTime: boolean;
    sticky: boolean;
  };
}

export enum ItemTypes {
  AnswerOnAir = 'AnswerOnAir',
  Chapter = 'Chapter',
  Hotspot = 'Hotspot',
  QuizQuestion = 'QuizQuestion',
  SummaryAndChapters = 'SummaryAndChapters',
}
