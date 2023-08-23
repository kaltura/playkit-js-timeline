//@flow
// eslint-disable-next-line no-unused-vars
import {Fragment, Component} from 'preact';
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
  segments: state.seekbar.segments
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
  _lastSegmentUpdated = false;

  /**
   * componentWillMount
   * @returns {void}
   */
  componentWillMount(): void {
    this._maybeAddDummySegment();
  }

  /**
   * componentWillUpdate
   * update the endTime of the last segment to match the duration from the engine
   * @returns {void}
   */
  componentWillUpdate(): void {
    if (!this._lastSegmentUpdated) {
      const potentialLastSegment = this.props.segments[this.props.segments.length - 1];
      if (potentialLastSegment.endTime - this.props.duration < 1) {
        this.props.updateSegmentEndTime(potentialLastSegment.id, this.props.duration);
        this._lastSegmentUpdated = true;
      }
    }
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
    return (
      <div className={styles.chaptersContainer} data-testid={'segmentsWrapper'}>
        {props.segments.map((chapter: any) => {
          return (
            <SeekBarSegment
              key={chapter.id}
              id={chapter.id}
              startTime={chapter.startTime}
              endTime={chapter.endTime}
              title={chapter.title}
              isHovered={chapter.isHovered}
              isDummy={chapter.isDummy}
              getThumbnailInfo={props.getThumbnailInfo}
            />
          );
        })}
      </div>
    );
  }
}

SegmentsWrapper.displayName = COMPONENT_NAME;
export {SegmentsWrapper};
