import {Component, Fragment, h, VNode} from 'preact';
import * as styles from './timeline-preview.scss';
import {A11yWrapper} from '@playkit-js/common/dist/hoc/a11y-wrapper';
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
  onArrowClick: () => void;
  cuePointsData: Array<CuePointMarker>;
  thumbnailInfo: any;
  isNavigationPluginOpen: () => boolean;
  shouldRenderArrowButton: () => boolean;
  questionTranslate?: string;
  reflectionPointTranslate?: string;
  hotspotTranslate?: string;
  aoaTranslate?: string;
  updateHoveredSegment?: (id: string, isHovered: boolean) => {};
  isSmallPlayer?: boolean;
  hidePreview?: boolean;
  markerStartTime?: number;
  showNavigationTranslate?: string;
  hideNavigationTranslate?: string;
  relevantChapter?: Chapter;
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
}

const mapStateToProps = (state: State, {markerStartTime}: TimelinePreviewProps) => {
  const previewTime = markerStartTime !== undefined ? markerStartTime : state.seekbar.virtualTime!;
  const relevantChapter = state.seekbar.segments!.find(chapter => chapter.startTime <= previewTime && previewTime <= chapter.endTime);
  return {
    isSmallPlayer: [PLAYER_SIZE.SMALL, PLAYER_SIZE.EXTRA_SMALL].includes(state.shell.playerSize),
    hidePreview: state.shell.playerSize === PLAYER_SIZE.TINY,
    relevantChapter
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

    const className = [styles.titleWrapper, this.props.isSmallPlayer ? styles.smallPlayer : ''].join(' ');
    return (
      <Fragment>
        {relevantChapter && relevantChapter.title && (
          <Title iconName={'chapter'} shouldDisplayTitle className={className}>
            {relevantChapter.title}
          </Title>
        )}
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

  private _renderArrowButton() {
    const isNavigationPluginOpen = this.props.isNavigationPluginOpen();
    return (
      <A11yWrapper onClick={this.props.onArrowClick}>
        <button
          aria-label={isNavigationPluginOpen ? this.props.hideNavigationTranslate : this.props.showNavigationTranslate}
          className={[styles.markerLink, this.props.isSmallPlayer ? styles.smallPlayer : ''].join(' ')}
          onMouseDown={this._handleMouseDown}
          data-testid="previewArrowButton">
          {isNavigationPluginOpen ? <Icon size={IconSize.medium} name={'arrowClose'} /> : <Icon size={IconSize.medium} name={'arrowOpen'} />}
        </button>
      </A11yWrapper>
    );
  }

  private _renderSmallPlayerHeader(relevantChapter: Chapter | undefined, data: any) {
    const {quizQuestions, hotspots, answerOnAir} = data;
    const titleClassName = [styles.titleWrapper, this.props.isSmallPlayer ? styles.smallPlayer : ''].join(' ');
    const itemsWrapperClassName = [styles.itemsWrapper, this.props.isSmallPlayer ? styles.smallPlayer : ''].join(' ');

    return (
      <div className={[styles.header, styles.smallPlayer].join(' ')}>
        <div className={itemsWrapperClassName} data-testid="cuePointPreviewHeaderItems">
          {relevantChapter && <Title iconName={'chapter'} shouldDisplayTitle={false} className={titleClassName} />}
          {hotspots.length > 0 && <Title iconName={'hotspot'} shouldDisplayTitle={false} className={titleClassName} />}
          {quizQuestions.length > 0 && <Title iconName={'quiz'} shouldDisplayTitle={false} className={titleClassName} />}
          {answerOnAir.length > 0 && <Title iconName={'answerOnAir'} shouldDisplayTitle={false} className={titleClassName} />}
        </div>
        {this.props.shouldRenderArrowButton() && this._renderArrowButton()}
      </div>
    );
  }

  onMouseMove = (e: MouseEvent) => {
    // prevent the preview from moving with the mouse
    e.stopPropagation();
  };

  private _handleMouseDown = (e: MouseEvent) => {
    // prevent onMouseDown event on seekbar node
    e.preventDefault();
    e.stopPropagation();
  };

  private _shouldRenderHeader(relevantChapter: Chapter | undefined): boolean {
    return !this.props.isSmallPlayer && (this.props.cuePointsData.length > 0 || !relevantChapter?.isDummy!);
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

  render() {
    if (this.props.hidePreview) {
      return null;
    }

    const {thumbnailInfo, isSmallPlayer, relevantChapter} = this.props;
    const data = this._getData();
    return (
      <div
        className={styles.container}
        data-testid="cuePointPreviewContainer"
        onMouseMove={this.onMouseMove}
        onMouseOver={() => this.onMouseOver(relevantChapter)}
        onMouseLeave={() => this.onMouseLeave(relevantChapter)}>
        {this._shouldRenderHeader(relevantChapter) ? (
          <div className={styles.header} data-testid="cuePointPreviewHeader">
            <div className={styles.itemsWrapper} data-testid="cuePointPreviewHeaderItems">
              {this._renderHeader(relevantChapter, data)}
            </div>
            {this.props.shouldRenderArrowButton() && this._renderArrowButton()}
          </div>
        ) : null}
        <div style={getFramePreviewImgContainerStyle(thumbnailInfo)}>
          {isSmallPlayer ? this._renderSmallPlayerHeader(relevantChapter, data) : null}
          <div style={getFramePreviewImgStyle(thumbnailInfo)} />
        </div>
      </div>
    );
  }
}
