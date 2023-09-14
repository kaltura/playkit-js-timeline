import {Component, Fragment, h, VNode} from 'preact';
import * as styles from './timeline-preview.scss';
import {A11yWrapper, OnClickEvent} from '@playkit-js/common/dist/hoc/a11y-wrapper';
import {ItemTypes, ThumbnailInfo} from '../../types/timelineTypes';
import {Chapter, CuePointMarker} from '../../../flow-typed/types/cue-point-option';
import {Icon, IconSize} from '@playkit-js/common/dist/icon';

const {withText, Text} = KalturaPlayer.ui.preacti18n;

const {
  redux: {connect},
  reducers: {seekbar},
  components: {PLAYER_SIZE}
} = KalturaPlayer.ui;

const translates = {
  questionTranslate: <Text id="timeline.question_title">Question</Text>,
  reflectionPointTranslate: <Text id="timeline.reflection_point_title">Reflection Point</Text>,
  hotspotTranslate: <Text id="timeline.hotspot_title">Hotspot</Text>,
  aoaTranslate: <Text id="timeline.audience_asked_title">Audience Asked</Text>,
  showNavigationTranslate: <Text id="navigation.show_plugin">Show Navigation</Text>,
  hideNavigationTranslate: <Text id="navigation.hide_plugin">Hide Navigation</Text>
};

interface TimelinePreviewProps {
  toggleNavigationPlugin: (e: OnClickEvent, byKeyboard: boolean, cuePointType: string) => void;
  seekTo: (time: number) => void;
  cuePointsData: Array<CuePointMarker>;
  thumbnailInfo: () => ThumbnailInfo | ThumbnailInfo[];
  questionTranslate?: string;
  reflectionPointTranslate?: string;
  hotspotTranslate?: string;
  aoaTranslate?: string;
  updateHoveredSegment?: (id: string, isHovered: boolean) => {};
  isExtraSmallPlayer?: boolean;
  hidePreview?: boolean;
  markerStartTime?: number;
  showNavigationTranslate?: string;
  hideNavigationTranslate?: string;
  relevantChapter?: Chapter;
  virtualTime?: number;
  duration?: number;
  getSeekBarNode: () => Element | null;
}

const getFramePreviewImgContainerStyle = (thumbnailInfo: ThumbnailInfo | ThumbnailInfo[]) => {
  if (!thumbnailInfo) {
    return {
      borderColor: 'transparent'
    };
  }
  if (Array.isArray(thumbnailInfo)) {
    const leftThumbInfo = thumbnailInfo[0];
    const rightThumbInfo = thumbnailInfo[1];
    let minHeight = leftThumbInfo.slide ? rightThumbInfo.height : leftThumbInfo.height;
    let minWidth = leftThumbInfo.slide ? rightThumbInfo.width : leftThumbInfo.width;
    if ([leftThumbInfo, rightThumbInfo].every(e => !e.slide)) {
      // use min height and width of media thumbs
      if (minHeight > rightThumbInfo.height) {
        minHeight = rightThumbInfo.height;
      }
      if (minWidth > rightThumbInfo.width) {
        minWidth = rightThumbInfo.width;
      }
    }
    return {
      height: `${minHeight}px`,
      width: `${minWidth * 2}px`
    };
  }
  return {
    height: `${thumbnailInfo.slide ? DEFAULT_THUMB_HEIGHT : thumbnailInfo.height}px`,
    width: `${thumbnailInfo.slide ? DEFAULT_THUMB_WIDTH : thumbnailInfo.width}px`
  };
};
const getFramePreviewImgStyle = (thumbnailInfo: ThumbnailInfo) => {
  if (thumbnailInfo) {
    return {
      height: '100%',
      width: '100%',
      backgroundImage: `url(${thumbnailInfo.url})`,
      backgroundPosition: thumbnailInfo.slide ? 'center' : `-${thumbnailInfo.x}px -${thumbnailInfo.y}px`,
      backgroundRepeat: 'no-repeat',
      ...(thumbnailInfo.slide && {backgroundSize: 'cover'})
    };
  }
  return '';
};

interface TitleProps {
  children?: VNode | string;
  iconName: string;
  shouldDisplayTitle: boolean;
  className: string;
}

const Title = ({iconName, children, shouldDisplayTitle = true, className}: TitleProps) => {
  return (
    <div className={className}>
      <Icon size={IconSize.small} name={iconName} />
      {shouldDisplayTitle && <span className={styles.title}>{children}</span>}
    </div>
  );
};

interface State {
  seekbar: {
    segments: Chapter[];
    virtualTime: number;
  };
  shell: {
    playerSize: string;
  };
  engine: {
    duration: number;
  };
}

const mapStateToProps = (state: State, {markerStartTime}: TimelinePreviewProps) => {
  const previewTime = markerStartTime !== undefined ? markerStartTime : state.seekbar.virtualTime!;
  const relevantChapter = state.seekbar.segments!.find(chapter => chapter.startTime <= previewTime && previewTime < chapter.endTime);
  return {
    isExtraSmallPlayer: state.shell.playerSize === PLAYER_SIZE.EXTRA_SMALL,
    hidePreview: state.shell.playerSize === PLAYER_SIZE.TINY,
    relevantChapter,
    virtualTime: state.seekbar.virtualTime,
    duration: state.engine.duration
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    updateHoveredSegment: (id: string, isHovered: boolean) => dispatch(seekbar.actions.updateHoveredSegment(id, isHovered))
  };
};

const DEFAULT_THUMB_WIDTH = 164;
const DEFAULT_THUMB_HEIGHT = 92;

@withText(translates)
@connect(mapStateToProps, mapDispatchToProps)
export class TimelinePreview extends Component<TimelinePreviewProps> {
  _previewHeaderElement: HTMLElement | null = null;
  _thumbnailContainerElement: HTMLElement | null = null;

  componentDidUpdate() {
    // force update the header title style in case the text was changed
    this._calculateLeftPosition();
  }

  private _calculateLeftPosition() {
    const left = this._getPreviewHeaderLeft();
    if (left !== null && this._previewHeaderElement) {
      this._previewHeaderElement.style.left = `${this._getPreviewHeaderLeft()}px`;
    }
  }

  private _renderHeader(relevantChapter: Chapter | undefined, data: any) {
    const {quizQuestions, hotspots, answerOnAir} = data;

    let quizQuestionTitle = {type: '', firstIndex: 1, lastIndex: ''};
    if (quizQuestions.length) {
      //@ts-ignore
      const reflectionPoint = quizQuestions.find(qq => qq.quizQuestionData.type === 3);
      quizQuestionTitle = {
        type: quizQuestions.length === 1 && reflectionPoint ? this.props.reflectionPointTranslate! : this.props.questionTranslate!,
        firstIndex: quizQuestions[0].quizQuestionData.index + 1,
        lastIndex: quizQuestions.length > 1 ? `-${quizQuestions[quizQuestions.length - 1].quizQuestionData.index + 1}` : ''
      };
    }

    if (!this.props.cuePointsData.length && relevantChapter?.title) {
      // not a marker - render only chapter
      return (
        <Title iconName={'chapter'} shouldDisplayTitle className={styles.titleWrapper}>
          {relevantChapter.title}
        </Title>
      );
    }
    return (
      <Fragment>
        {hotspots.length > 0 && (
          <Title iconName={'hotspot'} shouldDisplayTitle className={styles.titleWrapper}>
            {this.props.hotspotTranslate!}
          </Title>
        )}
        {quizQuestions.length > 0 && (
          <Title iconName={'quiz'} shouldDisplayTitle className={styles.titleWrapper}>
            <span>{`${quizQuestionTitle.type} ${quizQuestionTitle.firstIndex}${quizQuestionTitle.lastIndex}`}</span>
          </Title>
        )}
        {answerOnAir.length > 0 && (
          <Title iconName={'answerOnAir'} shouldDisplayTitle className={styles.titleWrapper}>
            {this.props.aoaTranslate!}
          </Title>
        )}
      </Fragment>
    );
  }

  private _getData(): any {
    const initialData: any = {[ItemTypes.QuizQuestion]: [], [ItemTypes.Hotspot]: [], [ItemTypes.AnswerOnAir]: []};
    const data = this.props.cuePointsData.reduce((acc, cp) => {
      return {
        ...acc,
        [cp.type]: [...acc[cp.type], cp]
      };
    }, initialData);

    return {
      hotspots: data[ItemTypes.Hotspot],
      quizQuestions: data[ItemTypes.QuizQuestion],
      answerOnAir: data[ItemTypes.AnswerOnAir]
    };
  }

  private _renderSmallPlayerHeader(relevantChapter: Chapter | undefined, data: any) {
    const {quizQuestions, hotspots, answerOnAir} = data;

    const renderItems = () => {
      if (relevantChapter && this.props.cuePointsData.length === 0) {
        return relevantChapter.isDummy ? null : <Title iconName={'chapter'} shouldDisplayTitle={false} className={styles.titleWrapper} />;
      }
      return (
        <Fragment>
          {hotspots.length > 0 && <Title iconName={'hotspot'} shouldDisplayTitle={false} className={styles.titleWrapper} />}
          {quizQuestions.length > 0 && <Title iconName={'quiz'} shouldDisplayTitle={false} className={styles.titleWrapper} />}
          {answerOnAir.length > 0 && <Title iconName={'answerOnAir'} shouldDisplayTitle={false} className={styles.titleWrapper} />}
        </Fragment>
      );
    };
    return (
      <div className={styles.header}>
        <div className={styles.itemsWrapper} data-testid="cuePointPreviewHeaderItems">
          {renderItems()}
        </div>
      </div>
    );
  }

  onMouseMove = (e: MouseEvent) => {
    // prevent the preview from moving with the mouse
    e.stopPropagation();
  };

  private _shouldRenderHeader(relevantChapter: Chapter | undefined): boolean {
    return !this.props.isExtraSmallPlayer && (this.props.cuePointsData.length > 0 || !relevantChapter?.isDummy!);
  }

  onMouseOver = (relevantChapter: Chapter | undefined) => {
    if (relevantChapter && !relevantChapter.isHovered && !relevantChapter.isDummy) {
      this.props.updateHoveredSegment!(relevantChapter.id, true);
    }
  };

  onMouseLeave = (relevantChapter: Chapter | undefined) => {
    if (relevantChapter?.isHovered) {
      this.props.updateHoveredSegment!(relevantChapter?.id, false);
    }
  };

  onThumbnailClick = (e: MouseEvent) => {
    this.props.seekTo(this.props.virtualTime!);
    // prevent onMouseDown event on seekbar node
    e.preventDefault();
    e.stopPropagation();
  };

  onPreviewHeaderClick = (e: OnClickEvent, byKeyboard: boolean) => {
    const relevantQuizQuestion = this.props.cuePointsData.find(cp => cp.type === ItemTypes.QuizQuestion);
    relevantQuizQuestion ? relevantQuizQuestion.quizQuestionData?.onClick() : this.props.seekTo(this.props.virtualTime!);
    this.props.toggleNavigationPlugin(e, byKeyboard, this.props.cuePointsData[0]?.type || ItemTypes.Chapter);
  };

  _getPreviewHeaderLeft(): number | null {
    const seekBarElement = this.props.getSeekBarNode();
    if (seekBarElement && this._previewHeaderElement) {
      const headerClientRects = this._previewHeaderElement.getClientRects()[0];
      const seekbarClientRects = seekBarElement.getClientRects()[0];
      const thumbClientRects = this._thumbnailContainerElement?.getClientRects()[0];

      if (!seekbarClientRects || !thumbClientRects || !headerClientRects) {
        return null;
      }
      const headerWidth = headerClientRects.width;
      const thumbWidth = thumbClientRects.width || DEFAULT_THUMB_WIDTH;
      const thumbLeft = thumbClientRects.left;
      const thumbRight = thumbClientRects.right;

      // header title width is smaller than thumb width
      const left = (thumbWidth - headerWidth) / 2;
      if (left >= 0) {
        return left;
      }

      // the header text left position is smaller than the left edge of the seekbar
      const textLeft = thumbLeft + left;
      if (textLeft < seekbarClientRects.left) {
        return seekbarClientRects.left - thumbLeft;
      }

      // the header text right position is greater than the right edge of the seekbar
      const textRight = thumbRight - left;
      if (textRight > seekbarClientRects.right) {
        return thumbWidth - headerWidth + seekbarClientRects.right - thumbRight;
      }

      return left;
    }
    return null;
  }

  handleFocus = () => {
    const seekBarNode = this.props.getSeekBarNode();
    if (seekBarNode) {
      // change slider role to prevent interrupts reading marker content by screen-readers
      seekBarNode.setAttribute('role', 'none');
    }
  };

  handleBlur = () => {
    const seekBarNode = this.props.getSeekBarNode();
    if (seekBarNode) {
      // restore slider role
      seekBarNode.setAttribute('role', 'slider');
    }
  };

  _getPreviewHeaderStyle(): any {
    const top = !this.props.thumbnailInfo ? '-20px' : null;
    const left = this._getPreviewHeaderLeft() === null ? null : `${this._getPreviewHeaderLeft}px`;
    if (top === null && left === null) return null;
    const style: any = {};
    if (top) style.top = top;
    if (left) style.left = left;
    return style;
  }

  private _renderThumbnail = (thumbnailInfo: ThumbnailInfo | Array<ThumbnailInfo>) => {
    if (Array.isArray(thumbnailInfo)) {
      return thumbnailInfo.map(info => <div style={getFramePreviewImgStyle(info)} />);
    }
    return <div style={getFramePreviewImgStyle(thumbnailInfo)} />;
  };

  render() {
    if (this.props.hidePreview) {
      return null;
    }

    const {thumbnailInfo, isExtraSmallPlayer, relevantChapter} = this.props;
    const data = this._getData();
    const className = [styles.container, this.props.isExtraSmallPlayer ? styles.xsPlayer : ''].join(' ');

    return (
      <div
        className={className}
        data-testid="cuePointPreviewContainer"
        onMouseMove={this.onMouseMove}
        onMouseOver={() => this.onMouseOver(relevantChapter)}
        onMouseLeave={() => this.onMouseLeave(relevantChapter)}>
        {this._shouldRenderHeader(relevantChapter) ? (
          <A11yWrapper onClick={this.onPreviewHeaderClick}>
            <div
              className={styles.header}
              ref={node => (this._previewHeaderElement = node)}
              data-testid="cuePointPreviewHeader"
              style={this._getPreviewHeaderStyle()}
              tabIndex={0}
              onFocus={this.handleFocus}
              onBlur={this.handleBlur}>
              <div className={styles.itemsWrapper} data-testid="cuePointPreviewHeaderItems">
                {this._renderHeader(relevantChapter, data)}
              </div>
            </div>
          </A11yWrapper>
        ) : null}
        <div
          className={styles.imageContainer}
          style={getFramePreviewImgContainerStyle(thumbnailInfo())}
          onMouseDown={this.onThumbnailClick}
          ref={node => (this._thumbnailContainerElement = node)}>
          {isExtraSmallPlayer ? this._renderSmallPlayerHeader(relevantChapter, data) : null}
          {this._renderThumbnail(thumbnailInfo())}
        </div>
      </div>
    );
  }
}
