import {Component, Fragment, h, VNode} from 'preact';
import * as styles from './timeline-preview.scss';
import {ItemTypes, ThumbnailInfo} from "../../types/timelineTypes";
import {Chapter, CuePointMarker} from "../../../flow-typed/types/cue-point-option";
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
  aoaTranslate: <Text id="timeline.audience_asked_title">Audience Asked</Text>
};

interface TimelinePreviewProps {
  onArrowClick: () => void,
  cuePointsData: Array<CuePointMarker>,
  thumbnailInfo: any,
  isNavigationPluginOpen: () => boolean,
  shouldRenderArrowButton: () => boolean,
  questionTranslate?: string,
  reflectionPointTranslate?: string,
  hotspotTranslate?: string,
  aoaTranslate?: string,
  virtualTime?: number,
  hoverActive?: boolean,
  chapters?: Chapter[],
  updateHoveredSegment?: (id: string, isHovered: boolean) => {},
  playerSize?: string
}

const getFramePreviewImgContainerStyle = (thumbnailInfo: ThumbnailInfo) => {
  return thumbnailInfo ? {
    height: `${thumbnailInfo.height}px`,
    width: `${thumbnailInfo.width}px`
  } : {};
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
  children?: VNode | string,
  iconName: string,
  shouldDisplayTitle: boolean,
  className: string
}

const Title = (({iconName, children, shouldDisplayTitle = true, className}: TitleProps) => {
  return (
    <div className={className}>
      <Icon
        size={IconSize.small}
        name={iconName}
      />
      {shouldDisplayTitle && <span className={styles.title}>{children}</span>}
    </div>
  );
});

const mapStateToProps = (state: {
  seekbar: {
    segments: Chapter[];
    virtualTime: number;
    hoverActive: boolean;
  },
  shell: {
    playerSize: string;
  };
}) => ({
  virtualTime: state.seekbar.virtualTime,
  hoverActive: state.seekbar.hoverActive,
  chapters: state.seekbar.segments,
  playerSize: state.shell.playerSize
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    updateHoveredSegment: (id: string, isHovered: boolean) => dispatch(seekbar.actions.updateHoveredSegment(id, isHovered))
  };
};

@withText(translates)
@connect(mapStateToProps, mapDispatchToProps)
export class TimelinePreview extends Component<TimelinePreviewProps> {
  private _handleClick = () => {
    this.props.onArrowClick();
  };

  private _renderHeader(relevantChapter: Chapter | undefined, data: any) {
    const {quizQuestions, hotspots, answerOnAir} = data;
    const isSmallPlayer = this.props.playerSize! === PLAYER_SIZE.SMALL;

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

    const className = [styles.titleWrapper, isSmallPlayer ? styles.smallPlayer : ''].join(' ');
    return (
      <div className={[styles.itemsWrapper, isSmallPlayer ? styles.smallPlayer : ''].join(' ')} data-testid="cuePointPreviewHeaderItems">
        {relevantChapter && relevantChapter.title && <Title iconName={'chapter'} shouldDisplayTitle className={className}>{relevantChapter.title}</Title>}
        {hotspots.length > 0 && <Title iconName={'hotspot'} shouldDisplayTitle className={className}>{this.props.hotspotTranslate!}</Title>}
        {quizQuestions.length > 0 &&
          <Title iconName={'quiz'} shouldDisplayTitle className={className}>
            <span>{`${quizQuestionTitle.type} ${quizQuestionTitle.firstIndex}${quizQuestionTitle.lastIndex}`}</span>
          </Title>}
        {answerOnAir.length > 0 && <Title iconName={'answerOnAir'} shouldDisplayTitle className={className}>{this.props.aoaTranslate!}</Title>}
      </div>
    );
  }

  private _getData(): any {
    const initialData: any = {[ItemTypes.QuizQuestion]: [], [ItemTypes.Hotspot]: [], [ItemTypes.AnswerOnAir]: []};
    const data = this.props.cuePointsData.reduce((acc, cp) => {
      return {
        ...acc,
        [cp.type]: [...acc[cp.type], cp]
      }
    }, initialData);

    return {
      hotspots: data[ItemTypes.Hotspot],
      quizQuestions: data[ItemTypes.QuizQuestion],
      answerOnAir: data[ItemTypes.AnswerOnAir]
    };
  }

  private _renderArrowButton() {
    const isNavigationPluginOpen = this.props.isNavigationPluginOpen();
    const isSmallPlayer = this.props.playerSize! === PLAYER_SIZE.SMALL;
    return (
      <Fragment>
        <button className={[styles.markerLink, !isNavigationPluginOpen ? styles.disabled : '', isSmallPlayer ? styles.smallPlayer : ''].join(' ')}
                onClick={this._handleClick} data-testid="previewArrowButton">
          <Icon size={IconSize.medium} name={'arrowClose'}/>
        </button>
        <button className={[styles.markerLink, isNavigationPluginOpen ? styles.disabled : '', isSmallPlayer ? styles.smallPlayer : ''].join(' ')}
                onClick={this._handleClick} data-testid="previewArrowButton">
          <Icon size={IconSize.medium} name={'arrowOpen'}/>
        </button>
      </Fragment>
    );
  };

  private _renderSmallPlayerHeader(relevantChapter: Chapter | undefined, data: any) {
    const {quizQuestions, hotspots, answerOnAir} = data;
    const isSmallPlayer = this.props.playerSize! === PLAYER_SIZE.SMALL;
    const titleClassName = [styles.titleWrapper, isSmallPlayer ? styles.smallPlayer : ''].join(' ');
    const itemsWrapperClassName = [styles.itemsWrapper, isSmallPlayer ? styles.smallPlayer : ''].join(' ');

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

  private _shouldRenderHeader(relevantChapter: Chapter | undefined): boolean {
    return this.props.playerSize !== 'small' && (this.props.cuePointsData.length > 0 || !relevantChapter?.isDummy!);
  }

  onMouseOver = (relevantChapter: Chapter | undefined) => {
    if (relevantChapter && !relevantChapter.isHovered && !relevantChapter.isDummy) {
      this.props.updateHoveredSegment!(relevantChapter.id, true);
    }
  }

  onMouseLeave = (relevantChapter: Chapter | undefined) => {
    if (relevantChapter?.isHovered) {
      this.props.updateHoveredSegment!(relevantChapter?.id, false);
    }
  }

  render() {
    const chapters = this.props.chapters;
    const relevantChapter = chapters!.find(chapter => chapter.startTime <= this.props.virtualTime! && this.props.virtualTime! <= chapter.endTime);
    const data = this._getData();
    const shouldRenderHeader = this._shouldRenderHeader(relevantChapter);
    return (
      <div
        className={[styles.container].join(' ')}
        data-testid="cuePointPreviewContainer"
        onMouseMove={this.onMouseMove}
        onMouseOver={() => this.onMouseOver(relevantChapter)}
        onMouseLeave={() => this.onMouseLeave(relevantChapter)}
      >
        {shouldRenderHeader ? (<div className={styles.header} data-testid="cuePointPreviewHeader">
          <div className={styles.itemsWrapper} data-testid="cuePointPreviewHeaderItems">
            {this._renderHeader(relevantChapter, data)}
          </div>
          {this.props.shouldRenderArrowButton() && this._renderArrowButton()}
        </div>) : undefined}
        <div style={getFramePreviewImgContainerStyle(this.props.thumbnailInfo)}>
          {this.props.playerSize === PLAYER_SIZE.SMALL ? this._renderSmallPlayerHeader(relevantChapter, data) : undefined}
          <div style={getFramePreviewImgStyle(this.props.thumbnailInfo)}/>
        </div>
      </div>
    );
  }
}
