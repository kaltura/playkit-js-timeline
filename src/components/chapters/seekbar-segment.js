//@flow
import * as KalturaPlayer from '@playkit-js/kaltura-player-js';
import styles from './seekbar-segment.scss';

const {redux, reducers, preact, components} = KalturaPlayer.ui;
const {Component} = preact;
const {seekbar} = reducers;
const {withPlayer} = components;

/**
 * mapping state to props
 * @param {*} state - redux store state
 * @returns {Object} - mapped state to this component
 */
const mapStateToProps = state => ({
  dataLoaded: state.engine.dataLoaded,
  currentTime: state.engine.currentTime,
  duration: state.engine.duration,
  seekbarClientRect: state.seekbar.clientRect,
  isMobile: state.shell.isMobile,
  isDraggingActive: state.seekbar.draggingActive,
  isHoverActive: state.seekbar.hoverActive,
  virtualTime: state.seekbar.virtualTime,
  activePresetName: state.shell.activePresetName,
  segments: state.seekbar.segments
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    updateHoveredSegment: (id: string, isHovered: boolean) => dispatch(seekbar.actions.updateHoveredSegment(id, isHovered))
  };
};

const COMPONENT_NAME = 'SeekBarSegment';

/**
 * SeekBarSegment component
 *
 * @class SeekBarSegment
 * @extends {Component}
 */
@redux.connect(mapStateToProps, mapDispatchToProps)
@withPlayer
class SeekBarSegment extends Component {
  _segmentEl: HTMLElement;
  _wasDragging: boolean;
  _prevDraggingState: boolean = false;

  /**
   * @returns {number} - the segment width
   * @private
   */
  _getSegmentWidth(): number {
    if (this._segmentEl && this.props.duration) {
      const seekbarRect = this.props.seekbarClientRect;
      const seekbarWidth = seekbarRect.width;
      const segmentStartTimePosition = (this.props.startTime < this.props.duration ? this.props.startTime / this.props.duration : 1) * seekbarWidth;
      const segmentEndTimePosition = (this.props.endTime < this.props.duration ? this.props.endTime / this.props.duration : 1) * seekbarWidth;
      return segmentEndTimePosition - segmentStartTimePosition;
    }
    return 0;
  }

  /**
   *
   * @param {HTMLDivElement} ref - ref
   * @returns {void}
   * @private
   */
  _setSegmentRef = (ref: HTMLDivElement | null) => {
    if (ref) {
      this._segmentEl = ref;
    }
  };

  /**
   * segment mouse over handler
   *
   * @returns {void}
   * @memberof SeekBarSegment
   */
  onMouseOver = (): void => {
    if (this.props.isMobile) return;
    this.props.updateHoveredSegment(this.props.id, true);
  };

  /**
   * segment mouse out handler
   *
   * @returns {void}
   * @memberof SeekBarSegment
   */
  onMouseLeave = (): void => {
    if (this.props.isMobile) return;
    this.props.updateHoveredSegment(this.props.id, false);
  };

  /**
   * get current buffered percent from the player
   *
   * @returns {number} - current player's buffered percent
   * @memberof SeekBar
   */
  getTotalBufferedPercent(): number {
    const {player} = this.props;
    if (this.props.duration > 0 && player.buffered.length > 0) {
      const buffered = player.isLive() ? player.buffered.end(0) - player.getStartTimeOfDvrWindow() : player.buffered.end(0);
      const bufferedPercent = (buffered / this.props.duration) * 100;
      return bufferedPercent < 100 ? bufferedPercent : 100;
    }
    return 0;
  }

  /**
   * get current progress percent
   *
   * @param {number} time - the time to use for calculating the progress width
   * @returns {number} - current progress percent
   * @private
   */
  _getProgressWidth(time: number): number {
    const {startTime, endTime} = this.props;
    const segmentDuration = endTime - startTime;
    let progressWidth = 0;
    if (time >= endTime || this.props.forceFullProgress) {
      progressWidth = 100;
    } else if (time >= startTime && time <= endTime) {
      progressWidth = ((time - startTime) / segmentDuration) * 100;
    }
    return progressWidth;
  }

  /**
   * get the segment's buffered percent
   *
   * @param {number} segmentWidth - the width of the segment
   * @param {number} totalBufferedWidth - total player's buffered width
   * @returns {number} - current segment's buffered percent
   * @private
   */
  _getSegmentBufferedWidth(segmentWidth: number, totalBufferedWidth: number): number {
    const segmentWidthPercentage = (segmentWidth / this.props.seekbarClientRect.width) * 100;
    const widthStartTime = (this.props.startTime / this.props.duration) * 100;
    const widthEndTime = (this.props.endTime / this.props.duration) * 100;
    let segmentBufferedWidth = 0;
    if (totalBufferedWidth >= widthEndTime) {
      segmentBufferedWidth = 100;
    } else if (totalBufferedWidth > widthStartTime && totalBufferedWidth < widthEndTime) {
      segmentBufferedWidth = ((totalBufferedWidth - widthStartTime) / segmentWidthPercentage) * 100;
    }
    return segmentBufferedWidth;
  }

  /**
   * render component
   *
   * @param {*} props - component props
   * @returns {React$Element} - component
   * @memberof SeekBarSegment
   */
  render(props: any): React$Element<any> {
    const {virtualTime, currentTime, isDraggingActive, isHovered, isDummy} = props;
    this._wasDragging = isDraggingActive !== this._prevDraggingState;
    this._prevDraggingState = isDraggingActive;
    const progressWidth = `${this._getProgressWidth(isDraggingActive || this._wasDragging ? virtualTime : currentTime)}%`;

    const totalBufferedWidth = Math.round(this.getTotalBufferedPercent());
    const segmentWidth = this._getSegmentWidth();
    const segmentBufferedWidth = Math.round(this._getSegmentBufferedWidth(segmentWidth, totalBufferedWidth));

    const segmentStyleClass = [styles.seekBarSegment];
    if (isHovered) segmentStyleClass.push(styles.hover);

    return (
      <div
        onMouseOver={this.onMouseOver}
        onMouseLeave={this.onMouseLeave}
        className={segmentStyleClass.join(' ')}
        style={`width: ${segmentWidth}px;`}
        ref={node => (this._segmentEl = node)}>
        <div className={[styles.segmentPadding, isDummy ? styles.dummy : ''].join(' ')} />
        <div className={styles.buffered} style={{width: `${segmentBufferedWidth}%`}} />
        {props.dataLoaded ? <div className={styles.segmentProgress} style={{width: progressWidth}} /> : undefined}
      </div>
    );
  }
}

SeekBarSegment.displayName = COMPONENT_NAME;
export {SeekBarSegment};
