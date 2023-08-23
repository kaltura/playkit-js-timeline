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
  thumbnailInfo: any;
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

const getFramePreviewImgContainerStyle = (thumbnailInfo: ThumbnailInfo) => {
  return thumbnailInfo
    ? {
        height: `${thumbnailInfo.height}px`,
        width: `${thumbnailInfo.width}px`
      }
    : {};
};
const getFramePreviewImgStyle = (thumbnailInfo: ThumbnailInfo) => {
  if (thumbnailInfo) {
    let framePreviewImgStyle = `height: 100%; width: 100%; background: url(${thumbnailInfo.url});`;
    framePreviewImgStyle += `background-position: -${thumbnailInfo.x}px -${thumbnailInfo.y}px;`;
    return framePreviewImgStyle;
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
  }
}

const mapStateToProps = (state: State, {markerStartTime}: TimelinePreviewProps) => {
  const previewTime = markerStartTime !== undefined ? markerStartTime : state.seekbar.virtualTime!;
  const relevantChapter = state.seekbar.segments!.find(chapter => chapter.startTime <= previewTime && previewTime < chapter.endTime);
  return {
    isExtraSmallPlayer: [PLAYER_SIZE.EXTRA_SMALL].includes(state.shell.playerSize),
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

@withText(translates)
@connect(mapStateToProps, mapDispatchToProps)
export class TimelinePreview extends Component<TimelinePreviewProps> {
  _previewHeaderElement: HTMLElement | undefined = undefined;
  _thumbnailContainerElement: HTMLElement | undefined = undefined;

  componentDidUpdate() {
    // force update the header title style in case the text was changed
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

    const className = [styles.titleWrapper, this.props.isExtraSmallPlayer ? styles.xsPlayer : ''].join(' ');
    if (relevantChapter && this.props.cuePointsData.length === 0) {
      // not a marker - render only chapter
      return (
        <Fragment>
          {relevantChapter.title && (
            <Title iconName={'chapter'} shouldDisplayTitle className={className}>
              {relevantChapter.title}
            </Title>
          )}
        </Fragment>
      );
    }
    return (
      <Fragment>
        {hotspots.length > 0 && (
          <Title iconName={'hotspot'} shouldDisplayTitle className={className}>
            {this.props.hotspotTranslate!}
          </Title>
        )}
        {quizQuestions.length > 0 && (
          <Title iconName={'quiz'} shouldDisplayTitle className={className}>
            <span>{`${quizQuestionTitle.type} ${quizQuestionTitle.firstIndex}${quizQuestionTitle.lastIndex}`}</span>
          </Title>
        )}
        {answerOnAir.length > 0 && (
          <Title iconName={'answerOnAir'} shouldDisplayTitle className={className}>
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
    const titleClassName = [styles.titleWrapper, this.props.isExtraSmallPlayer ? styles.xsPlayer : ''].join(' ');
    const itemsWrapperClassName = [styles.itemsWrapper, this.props.isExtraSmallPlayer ? styles.xsPlayer : ''].join(' ');

    const renderItems = () => {
      if (relevantChapter && this.props.cuePointsData.length === 0) {
        return <Title iconName={'chapter'} shouldDisplayTitle={false} className={titleClassName} />;
      } else {
        return (
          <Fragment>
            {hotspots.length > 0 && <Title iconName={'hotspot'} shouldDisplayTitle={false} className={titleClassName} />}
            {quizQuestions.length > 0 && <Title iconName={'quiz'} shouldDisplayTitle={false} className={titleClassName} />}
            {answerOnAir.length > 0 && <Title iconName={'answerOnAir'} shouldDisplayTitle={false} className={titleClassName} />}
          </Fragment>
        );
      }
    }

    return (
      <div className={[styles.header, styles.xsPlayer].join(' ')}>
        <div className={itemsWrapperClassName} data-testid="cuePointPreviewHeaderItems">
          {renderItems()}
          {/*{relevantChapter && <Title iconName={'chapter'} shouldDisplayTitle={false} className={titleClassName} />}*/}
          {/*{hotspots.length > 0 && <Title iconName={'hotspot'} shouldDisplayTitle={false} className={titleClassName} />}*/}
          {/*{quizQuestions.length > 0 && <Title iconName={'quiz'} shouldDisplayTitle={false} className={titleClassName} />}*/}
          {/*{answerOnAir.length > 0 && <Title iconName={'answerOnAir'} shouldDisplayTitle={false} className={titleClassName} />}*/}
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
  }

  onPreviewHeaderClick = (e: OnClickEvent, byKeyboard: boolean) => {
    const relevantQuizQuestion = this.props.cuePointsData.find(cp => cp.type === ItemTypes.QuizQuestion);
    relevantQuizQuestion ? relevantQuizQuestion.quizQuestionData?.onClick() : this.props.seekTo(this.props.virtualTime!);
    this.props.toggleNavigationPlugin(e, byKeyboard, this.props.cuePointsData[0]?.type || ItemTypes.Chapter);
  }

  _getPreviewHeaderLeft(): number | null {
    const seekBarElement = this.props.getSeekBarNode();
    if (seekBarElement && this._previewHeaderElement) {
      const headerClientRects = this._previewHeaderElement.getClientRects()[0];
      const seekbarClientRects = seekBarElement.getClientRects()[0];
      const thumbClientRects = this._thumbnailContainerElement?.getClientRects()[0];

      if (!seekbarClientRects || !thumbClientRects || !headerClientRects) return null;
      const headerWidth = headerClientRects.width;
      const thumbWidth = thumbClientRects.width || 164;
      const thumbLeft = thumbClientRects.left;
      const thumbRight = thumbClientRects.right;

      // header title width is smaller than thumb width
      const left = (thumbWidth - headerWidth) / 2;
      if (left >= 0) return left;

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

  render() {
    if (this.props.hidePreview) {
      return null;
    }

    const {thumbnailInfo, isExtraSmallPlayer, relevantChapter} = this.props;
    const data = this._getData();
    const previewHeaderStyle: any = this._getPreviewHeaderLeft() === null ? null : {left: `${this._getPreviewHeaderLeft}px`};

    return (
      <div
        className={styles.container}
        data-testid="cuePointPreviewContainer"
        onMouseMove={this.onMouseMove}
        onMouseOver={() => this.onMouseOver(relevantChapter)}
        onMouseLeave={() => this.onMouseLeave(relevantChapter)}>
        {this._shouldRenderHeader(relevantChapter) ? (
          <A11yWrapper onClick={this.onPreviewHeaderClick}>
            <div className={styles.header} ref={c => (c ? (this._previewHeaderElement = c) : undefined)} data-testid="cuePointPreviewHeader" style={previewHeaderStyle} tabIndex={0}>
              <div className={styles.itemsWrapper} data-testid="cuePointPreviewHeaderItems">
                {this._renderHeader(relevantChapter, data)}
              </div>
            </div>
          </A11yWrapper>
        ) : null}
        <div
          className={styles.imageContainer}
          style={getFramePreviewImgContainerStyle(thumbnailInfo)}
          onMouseDown={this.onThumbnailClick}
          ref={c => (c ? (this._thumbnailContainerElement = c) : undefined)}>
          {isExtraSmallPlayer ? this._renderSmallPlayerHeader(relevantChapter, data) : null}
          <div style={getFramePreviewImgStyle(thumbnailInfo)} />
        </div>
      </div>
    );
  }
}
