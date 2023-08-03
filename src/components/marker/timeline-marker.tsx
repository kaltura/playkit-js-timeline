import {h} from 'preact';
import * as KalturaPlayer from '@playkit-js/kaltura-player-js';
import * as styles from './timeline-marker.scss';
import type {TimelineMarkerProps} from '../../types/timelineTypes';
import {A11yWrapper} from '@playkit-js/common/dist/hoc/a11y-wrapper';
import {useMemo} from 'preact/hooks';
import {Chapter} from "../../../flow-typed/types/cue-point-option";

const {
  redux: {useSelector}
} = KalturaPlayer.ui;

export const TimelineMarker = (({isDisabled, onMarkerClick, getSeekBarNode, useQuizQuestionMarkerSize, setMarkerRef = () => {}, markerStartTime}: TimelineMarkerProps) => {
  const segment: Chapter = useSelector((state: any) => state.seekbar.segments.find((segment: Chapter) => markerStartTime >= segment.startTime && markerStartTime < segment.endTime));
  const hoverActive = useSelector((state: any) => {
    return segment ? segment.isHovered : state.seekbar.hoverActive;
  });
  const isSeekbarSegmented = !!segment;
  useSelector((state: any) => state.seekbar); // trigger update of marker component
  const disabled = typeof isDisabled === 'boolean' ? isDisabled : isDisabled();
  const renderMarker = useMemo(() => {
    const handleFocus = () => {
      const seekBarNode = getSeekBarNode();
      if (seekBarNode) {
        // change slider role to prevent interrupts reading marker content by screen-readers
        seekBarNode.setAttribute('role', 'none');
      }
    };
    const handleBlur = () => {
      const seekBarNode = getSeekBarNode();
      if (seekBarNode) {
        // restore slider role
        seekBarNode.setAttribute('role', 'slider');
      }
    };

    const getTransformValue = (): number => {
      if (useQuizQuestionMarkerSize && isSeekbarSegmented && hoverActive) {
        return -4;
      } else if (useQuizQuestionMarkerSize || (isSeekbarSegmented && hoverActive)) {
        return -2;
      }
      return 0;
    };

    return (
      <A11yWrapper onClick={onMarkerClick}>
        <div
          ref={setMarkerRef}
          onFocus={handleFocus}
          onBlur={handleBlur}
          tabIndex={disabled ? -1 : 0}
          data-testid="cuePointMarkerContainer"
          className={`${useQuizQuestionMarkerSize ? styles.quizQuestionMarkerSize : styles.smallMarker} ${hoverActive ? styles.hover : ''}`}
          style={`transform: translateY(${getTransformValue()}px)`}>
          <div className={`${styles.marker}`} />
        </div>
      </A11yWrapper>
    );
  }, [disabled, hoverActive, useQuizQuestionMarkerSize, isSeekbarSegmented]);

  return renderMarker;
});
