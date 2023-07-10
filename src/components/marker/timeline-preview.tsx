import {Component, Fragment, h, VNode} from 'preact';
import * as styles from './timeline-preview.scss';
import {ItemTypes, ThumbnailInfo} from "../../types/timelineTypes";
import {CuePointMarker} from "../../../flow-typed/types/cue-point-option";
import {Icon, IconSize} from '@playkit-js/common/dist/icon';

const {withText, Text} = KalturaPlayer.ui.preacti18n;

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
  chaptersData: any[],
  questionTranslate?: string,
  reflectionPointTranslate?: string,
  hotspotTranslate?: string,
  aoaTranslate?: string
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
  children: VNode | string,
  iconName: string
}

const Title = (({iconName, children}: TitleProps) => {
  return (
  <div className={styles.titleWrapper}>
    <Icon
      size={IconSize.small}
      name={iconName}
    />
    <span className={styles.title}>{children}</span>
  </div>
  );
});

@withText(translates)
export class TimelinePreview extends Component<TimelinePreviewProps> {
  private _handleClick = () => {
    this.props.onArrowClick();
  };

  private _renderHeader() {
    // organize the header by cuePoint types
    const initialData: any = { [ItemTypes.QuizQuestion]: [], [ItemTypes.Hotspot]: [], [ItemTypes.AnswerOnAir]: [] };
    const data = this.props.cuePointsData.reduce((acc, cp) => {
      return {
        ...acc,
        [cp.type]: [...acc[cp.type], cp]
      }
    }, initialData);

    const hotspots: any[] = data[ItemTypes.Hotspot];
    const quizQuestions: any[] = data[ItemTypes.QuizQuestion];
    const answerOnAir: any[] = data[ItemTypes.AnswerOnAir];
    const chapters = this.props.chaptersData;

    let quizQuestionTitle = {type: '', firstIndex: 1, lastIndex: ''};
    if (quizQuestions.length) {
      const reflectionPoint = quizQuestions.find(qq => qq.quizQuestionData.type === 3);
      quizQuestionTitle = {
        type: quizQuestions.length === 1 && reflectionPoint ? this.props.reflectionPointTranslate! : this.props.questionTranslate!,
        firstIndex: quizQuestions[0].quizQuestionData.index + 1,
        lastIndex: quizQuestions.length > 1 ? `-${quizQuestions[quizQuestions.length - 1].quizQuestionData.index + 1}` : ''
      };
    }

    return (
      <Fragment>
        {chapters.length > 0 && <Title iconName={'chapter'}>{chapters[0].title}</Title>}
        {hotspots.length > 0 && <Title iconName={'hotspot'}>{this.props.hotspotTranslate!}</Title>}
        {quizQuestions.length > 0 &&
          <Title iconName={'quiz'}>
            <span>{`${quizQuestionTitle.type} ${quizQuestionTitle.firstIndex}${quizQuestionTitle.lastIndex}`}</span>
          </Title>}
        {answerOnAir.length > 0 && <Title iconName={'answerOnAir'}>{this.props.aoaTranslate!}</Title>}
      </Fragment>
    );
  }

  private _renderArrowButton() {
    const isNavigationPluginOpen = this.props.isNavigationPluginOpen();
    return (
      <Fragment>
        <button className={[styles.markerLink, !isNavigationPluginOpen ? styles.disabled : ''].join(' ')} onClick={this._handleClick} data-testid="previewArrowButton">
          <Icon size={IconSize.medium} name={'arrowClose'} />
        </button>
        <button className={[styles.markerLink, isNavigationPluginOpen ? styles.disabled : ''].join(' ')} onClick={this._handleClick} data-testid="previewArrowButton">
          <Icon size={IconSize.medium} name={'arrowOpen'} />
        </button>
      </Fragment>
    );
  };

  render() {
    return (
      <div className={styles.container} data-testid="cuePointPreviewContainer">
        <div className={styles.header} data-testid="cuePointPreviewHeader">
          <div className={styles.itemsWrapper} data-testid="cuePointPreviewHeaderItems">
            {this._renderHeader()}
          </div>
          {this.props.shouldRenderArrowButton() && this._renderArrowButton()}
        </div>
        <div style={getFramePreviewImgContainerStyle(this.props.thumbnailInfo)}>
          <div style={getFramePreviewImgStyle(this.props.thumbnailInfo)} />
        </div>
      </div>
    );
  }
}
