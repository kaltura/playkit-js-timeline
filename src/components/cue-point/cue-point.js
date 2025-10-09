//@flow
import * as KalturaPlayer from '@playkit-js/kaltura-player-js';
import styles from './cue-point.scss';
import {cssVarsSupported} from 'css-vars-support';
import {Chapter} from '../../../flow-typed/types/cue-point-option';

const {preact, redux, reducers, utils, style} = KalturaPlayer.ui;
const {Utils} = KalturaPlayer.core;

/**
 * mapping state to props
 * @param {*} state - redux store state
 * @returns {Object} - mapped state to this component
 */
const mapStateToProps = state => ({
  config: state.config.components.seekbar,
  duration: state.engine.duration,
  seekbarClientRect: state.seekbar.clientRect,
  hideTimeBubble: state.seekbar.hideTimeBubble,
  virtualTime: state.seekbar.virtualTime,
  seekbarSegments: state.seekbar.segments,
  hoverActive: state.seekbar.hoverActive
});

const COMPONENT_NAME = 'CuePoint';

/**
 * CuePoint component
 *
 * @class CuePoint
 * @extends {Component}
 */
@redux.connect(mapStateToProps, utils.bindActions(reducers.seekbar.actions))
class CuePoint extends preact.Component {
  _markerRef: ?HTMLDivElement;
  _previewRef: ?HTMLDivElement;
  _hideTimeBubble: boolean;

  /**
   * @returns {number} - the marker left position
   * @private
   */
  _getMarkerPositionStyle(): {left: string, edge: string} {
    const styleObj = {left: '0', edge: 'Left'};
    let left = 0;
    if (this._markerRef && this.props.duration) {
      const markerRect = this._markerRef.getBoundingClientRect();
      const seekbarRect = this.props.seekbarClientRect;
      const markerWidth = markerRect.width;
      const seekbarWidth = seekbarRect.width;
      const markerPosition = (this.props.time < this.props.duration ? this.props.time / this.props.duration : 1) * seekbarWidth;
      if (markerPosition - markerWidth / 2 > 0) {
        if (markerPosition + markerWidth / 2 > seekbarWidth) {
          left = seekbarWidth - markerWidth;
          styleObj.edge = 'Right';
        } else {
          left = markerPosition - markerWidth / 2;
          styleObj.edge = 'none';
        }
      }
      styleObj.left = `${left}px`;
    }
    return styleObj;
  }

  /**
   * @param {number} previewWidth - the preview width
   * @returns {number} - the preview left position
   * @private
   */
  _getPreviewPosition(previewWidth: number): number {
    let left = 0;
    if (this._markerRef) {
      const previewWrapperWidth = this._previewRef?.getBoundingClientRect()?.width ?? previewWidth;
      const markerRect = this._markerRef.getBoundingClientRect();
      const seekbarRect = this.props.seekbarClientRect;
      const markerLeft = markerRect.left - seekbarRect.left;
      const markerWidth = markerRect.width;
      const markerRight = markerLeft + markerWidth;
      const seekbarWidth = seekbarRect.width;
      const previewOffset = (previewWrapperWidth - markerWidth) / 2;
      if (markerLeft - previewOffset > 0) {
        if (markerRight + previewOffset > seekbarWidth) {
          left = -(previewWrapperWidth - (seekbarWidth - markerLeft));
        } else {
          left = -previewOffset;
        }
      } else {
        left = -markerLeft;
      }
    }
    return left;
  }

  /**
   * on marker mouse over handler.
   * @returns {void}
   */
  onMarkerMouseOver(): void {
    this.setState({hover: true});
    if (this.props.preview.get) {
      this.props.updateHideSeekbarPreview(true);
    }
    if (!this.props.hideTimeBubble && this.props.preview.hideTime) {
      this._hideTimeBubble = true;
      this.props.updateHideSeekbarTimeBubble(true);
    }
    const segment = this.props.seekbarSegments.find((segment: Chapter) => this.props.time >= segment.startTime && this.props.time < segment.endTime);
    if (segment && !segment.isHovered) {
      this.props.updateHoveredSegment(segment.id, true);
    }
  }

  /**
   * on marker mouse leave handler.
   * @returns {void}
   */
  onMarkerMouseLeave(): void {
    this.setState({hover: false});
    this.props.updateHideSeekbarPreview(false);
    if (this._hideTimeBubble) {
      this._hideTimeBubble = false;
      this.props.updateHideSeekbarTimeBubble(false);
    }
    const segment = this.props.seekbarSegments.find((segment: Chapter) => this.props.time >= segment.startTime && this.props.time < segment.endTime);
    if (segment && segment.isHovered) {
      this.props.updateHoveredSegment(segment.id, false);
    }
  }

  /**
   * on preview mouse over handler.
   * @returns {void}
   */
  onPreviewMouseOver(): void {
    this.props.updateSeekbarPreviewHoverActive(true);
  }

  /**
   * on preview mouse leave handler.
   * @returns {void}
   */
  onPreviewMouseLeave(): void {
    this.props.updateSeekbarPreviewHoverActive(false);
  }

  /**
   * componentDidMount
   * @returns {void}
   */
  componentDidMount(): void {
    this._hideTimeBubble = false;
  }

  /**
   * componentWillUnmount
   * @returns {void}
   */
  componentWillUnmount(): void {
    this.props.updateHideSeekbarPreview(false);
    if (this._hideTimeBubble) {
      this.props.updateHideSeekbarTimeBubble(false);
    }
  }

  /**
   *
   * @returns {void}
   * @private
   */
  _update = () => {
    this.setState(prevState => ({render: !prevState.render}));
  };

  /**
   *
   * @param {HTMLDivElement} ref - ref
   * @returns {void}
   * @private
   */
  _setMarkerRef = (ref: HTMLDivElement | null) => {
    if (ref) {
      this._markerRef = ref;
      this._update();
    }
  };

  /**
   *
   * @param {HTMLDivElement} ref - ref
   * @returns {void}
   * @private
   */
  _setPreviewRef = (ref: HTMLDivElement | null) => {
    if (ref) {
      this._previewRef = ref;
      this._update();
    }
  };

  /**
   * render component
   * @param {*} props - component props
   * @returns {React$Element} - component element
   */
  render(props: any): React$Element<any> | void {
    const {marker, preview, virtualTime, config, hoverActive} = props;
    const {edge, left} = this._getMarkerPositionStyle();

    const cuePointContainerStyle = {
      left
    };
    if (edge !== 'none') {
      cuePointContainerStyle[`padding${edge}`] = 0;
    }
    if (cssVarsSupported()) {
      Utils.Object.mergeDeep(cuePointContainerStyle, {
        '--white': style.white,
        '--progress-bar-height': style.progressBarHeight,
        '--progress-bar-border-radius': style.progressBarBorderRadius
      });
    }

    const markerStyle = {backgroundColor: marker.color, width: marker.width};
    const cuePointClassName = [
      styles.playkitCuePoint,
      this.state.hover ? style.hover : '',
      edge !== 'none' ? `playkit-${edge.toLowerCase()}-border-radius` : ''
    ];
    let markerProps = {
      className: (marker.className ? [...cuePointClassName, marker.className] : cuePointClassName).join(' '),
      style: marker.props ? {...markerStyle, ...marker.props.style} : markerStyle
    };
    markerProps = {...marker.props, ...markerProps};

    const previewWidth = preview.width || marker.width;
    const previewHeight = preview.height || marker.height;
    const previewStyle = {
      width: `${previewWidth}px`,
      height: `${previewHeight}px`
    };
    let previewProps: Object = {
      style: preview.props ? {...previewStyle, ...preview.props.style} : previewStyle
    };
    if (preview.className) {
      previewProps.className = preview.className;
    }
    previewProps = {
      ...preview.props,
      ...previewProps,
      defaultPreviewProps: {
        virtualTime,
        thumbsSlices: config.thumbsSlices,
        thumbsWidth: config.thumbsWidth,
        thumbsSprite: config.thumbsSprite
      }
    };
    return (
      <div
        onMouseOver={() => this.onMarkerMouseOver()}
        onMouseLeave={() => this.onMarkerMouseLeave()}
        className={styles.playkitCuePointContainer}
        style={cuePointContainerStyle}
        ref={this._setMarkerRef}
        data-testid="cuePointContainer">
        {marker.get ? preact.h(marker.get, markerProps) : <div style={markerStyle} className={[...cuePointClassName, marker.className].join(' ')} />}
        {this._markerRef && preview.get ? (
          <div
            onMouseOver={() => this.onPreviewMouseOver()}
            onMouseLeave={() => this.onPreviewMouseLeave()}
            className={[
              styles.playkitCuePointPreviewContainer,
              hoverActive ? styles.hoverActive : '',
              preview.sticky === false ? style.nonSticky : ''
            ].join(' ')}
            style={{
              left: `${this._getPreviewPosition(previewWidth)}px`
            }}
            ref={this._setPreviewRef}>
            {preact.h(preview.get, previewProps)}
          </div>
        ) : undefined}
      </div>
    );
  }
}

CuePoint.displayName = COMPONENT_NAME;
export {CuePoint};
