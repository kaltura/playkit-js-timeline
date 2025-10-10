//@flow
// eslint-disable-next-line no-unused-vars
import {Component} from 'preact';
import styles from './segments-wrapper.scss';
// eslint-disable-next-line no-unused-vars
import {SeekBarSegment} from './seekbar-segment';
import * as KalturaPlayer from '@playkit-js/kaltura-player-js';
import {Chapter} from '../../../flow-typed/types/cue-point-option';
const {redux, reducers} = KalturaPlayer.ui;
const {seekbar} = reducers;

const COMPONENT_NAME = 'SegmentsWrapper';

/**
 * mapping state to props
 * @param {*} state - redux store state
 * @returns {Object} - mapped state to this component
 */
const mapStateToProps = state => ({
  isMobile: state.shell.isMobile,
  duration: state.engine.duration,
  segments: state.seekbar.segments,
  seekbarClientRect: state.seekbar.clientRect
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    updateSeekbarSegments: (segments: Chapter[]) => dispatch(seekbar.actions.updateSeekbarSegments(segments)),
    updateSegmentEndTime: (id: string, endTime: number) => dispatch(seekbar.actions.updateSegmentEndTime(id, endTime))
  };
};

/**
 * SegmentsWrapper component
 *
 * @class SegmentsWrapper
 * @extends {Component}
 */
@redux.connect(mapStateToProps, mapDispatchToProps)
class SegmentsWrapper extends Component {
  /**
   * componentWillMount
   * @returns {void}
   */
  componentWillMount(): void {
    this._maybeAddDummySegment();
  }

  _maybeAddDummySegment = () => {
    // in case there is no real chapter at startTime=0, we need to manually add a "dummy" chapter to complete the segments on the seekbar
    const chapterWithPositionZero = this.props.segments.find(chapter => chapter.startTime === 0);
    if (!chapterWithPositionZero) {
      this.props.updateSeekbarSegments([
        {id: '0', startTime: 0, endTime: this.props.segments[0].startTime, isDummy: true, isHovered: false},
        ...this.props.segments
      ]);
    }
  };

  render(props: any): React$Element<any> {
    const {duration, seekbarClientRect} = props;
    const seekbarWidth = seekbarClientRect?.width || 0;

    return (
      <div className={styles.chaptersContainer} data-testid={'segmentsWrapper'}>
        {props.segments.map((chapter: any) => {
          // Calculate segment position - based on the time proportion
          const startPercent = chapter.startTime / duration;
          const position = startPercent * seekbarWidth;

          // Create stringified style for left positioning
          const styleString = `left: ${position}px;`;

          return (
            <SeekBarSegment
              key={chapter.id}
              id={chapter.id}
              startTime={chapter.startTime}
              endTime={chapter.endTime}
              title={chapter.title}
              isHovered={chapter.isHovered}
              isDummy={chapter.isDummy}
              style={styleString} // Pass as string to match the component's expectation
              segments={props.segments} // Pass all segments to each segment component
            />
          );
        })}
      </div>
    );
  }
}

SegmentsWrapper.displayName = COMPONENT_NAME;
export {SegmentsWrapper};
