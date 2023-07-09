import {h} from 'preact';
import {ui} from '@playkit-js/kaltura-player-js';
import * as styles from './timeline-marker.scss';
import type {TimelineMarkerProps} from '../../types/timelineTypes';
import {A11yWrapper} from '@playkit-js/common/dist/hoc/a11y-wrapper';
import {useMemo} from 'preact/hooks';

const {
  redux: {useSelector}
} = ui;

export const TimelineMarker = (({isDisabled, onMarkerClick, getSeekBarNode, useQuizQuestionMarkerSize, setMarkerRef = () => {}}: TimelineMarkerProps) => {
  const hoverActive = useSelector((state: any) => state.seekbar.hoverActive);
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
    return (
      <A11yWrapper onClick={onMarkerClick}>
        <div
          ref={setMarkerRef}
          onFocus={handleFocus}
          onBlur={handleBlur}
          tabIndex={disabled ? -1 : 0}
          data-testid="cuePointMarkerContainer"
          className={`${useQuizQuestionMarkerSize ? styles.quizQuestionMarkerSize : styles.smallMarker} ${hoverActive ? styles.hover : ''}`}>
          <div className={`${styles.marker}`} />
        </div>
      </A11yWrapper>
    );
  }, [disabled, hoverActive, useQuizQuestionMarkerSize]);

  return renderMarker;
});
