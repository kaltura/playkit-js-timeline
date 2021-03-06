import * as KalturaPlayer from 'kaltura-player-js';
import * as TestUtils from './utils/test-utils';
import {TimelineManager} from '../../src/timeline-manager';

const {setup, ui} = KalturaPlayer;

describe('Timeline Manager', function () {
  const targetId = 'player-placeholder_ui.spec';

  class customMarker extends ui.preact.Component {
    render(props) {
      return <div {...props} />;
    }
  }

  class customPreview extends ui.preact.Component {
    render(props) {
      return <div {...props} />;
    }
  }

  class customSeekbarPreview extends ui.preact.Component {
    render(props) {
      return <div {...props} />;
    }
  }

  let player, sandbox;
  const config = {
    targetId,
    provider: {}
  };

  before(function () {
    TestUtils.createElement('DIV', targetId);
  });

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    player = setup(config);
    player.ui.registerManager('timeline', new TimelineManager(player, console));
  });

  afterEach(function () {
    sandbox.restore();
    player.ui._uiManager.store.getState.restore && player.ui._uiManager.store.getState.restore();
    player.destroy();
  });

  after(function () {
    TestUtils.removeVideoElementsFromTestPage();
  });

  describe('addCuePoint', function () {
    it('Should add a default cue point with no preview', function (done) {
      const cuePoint = player.ui.getManager('timeline').addCuePoint({
        time: 50
      });
      try {
        (typeof cuePoint.id).should.equals('string');
        setTimeout(() => {
          const progressBar = document.querySelector('.playkit-progress-bar');
          const cuePointEl = progressBar.lastElementChild;
          const markerEl = cuePointEl.children[0];
          markerEl.className.should.equals('playkit-cue-point  playkit-left-border-radius ');
          (cuePointEl.children[1] === undefined).should.be.true;
          done();
        });
      } catch (e) {
        done(e);
      }
    });

    it('Should add custom cue point with custom marker', function (done) {
      const cuePoint = player.ui.getManager('timeline').addCuePoint({
        time: 50,
        marker: {
          get: customMarker,
          props: {
            key1: 'value1'
          },
          color: 'red',
          width: 30,
          className: 'custom-marker-class'
        }
      });
      try {
        (typeof cuePoint.id).should.equals('string');
        setTimeout(() => {
          const progressBar = document.querySelector('.playkit-progress-bar');
          const cuePointEl = progressBar.lastElementChild;
          const markerEl = cuePointEl.children[0];
          markerEl.className.should.equals('playkit-cue-point  playkit-left-border-radius custom-marker-class');
          markerEl.style.width.should.equals('30px');
          markerEl.style.backgroundColor.should.equals('red');
          markerEl.getAttribute('key1').should.equals('value1');
          done();
        });
      } catch (e) {
        done(e);
      }
    });

    it('Should add custom cue point with custom preview', function (done) {
      const cuePoint = player.ui.getManager('timeline').addCuePoint({
        time: 50,
        marker: {
          color: 'red',
          width: 30,
          className: 'custom-marker-class'
        },
        preview: {
          get: customPreview,
          props: {
            key2: 'value2'
          },
          width: 50,
          height: 40,
          className: 'custom-preview-class',
          hideTime: true,
          sticky: false
        }
      });
      try {
        (typeof cuePoint.id).should.equals('string');
        setTimeout(() => {
          const progressBar = document.querySelector('.playkit-progress-bar');
          const cuePointEl = progressBar.lastElementChild;
          const markerEl = cuePointEl.children[0];
          const previewEl = cuePointEl.children[1];
          markerEl.className.should.equals('playkit-cue-point  playkit-left-border-radius custom-marker-class');
          markerEl.style.width.should.equals('30px');
          markerEl.style.backgroundColor.should.equals('red');
          previewEl.className.should.equals('playkit-cue-point-preview-container playkit-non-sticky');
          previewEl.children[0].className.should.equals('custom-preview-class');
          previewEl.children[0].getAttribute('key2').should.equals('value2');
          previewEl.children[0].getAttribute('defaultpreviewprops').should.be.exist;
          previewEl.children[0].style.width.should.equals('50px');
          previewEl.children[0].style.height.should.equals('40px');
          done();
        });
      } catch (e) {
        done(e);
      }
    });

    it('Should not add and return null when time is missing', function (done) {
      const cuePoint1 = player.ui.getManager('timeline').addCuePoint();
      const cuePoint2 = player.ui.getManager('timeline').addCuePoint({});
      try {
        (cuePoint1 === null).should.be.true;
        (cuePoint2 === null).should.be.true;
        setTimeout(() => {
          const progressBar = document.querySelector('.playkit-progress-bar');
          progressBar.lastElementChild.className.should.not.equals('playkit-cue-point-container');
          done();
        });
      } catch (e) {
        done(e);
      }
    });

    it('Should not add and return null when is live', function (done) {
      const state = player.ui._uiManager.store.getState();
      sandbox.stub(player.ui._uiManager.store, 'getState').callsFake(function () {
        state.engine.isLive = true;
        state.engine.isDvr = true;
        return state;
      });
      const cuePoint = player.ui.getManager('timeline').addCuePoint({
        time: 50
      });
      try {
        (cuePoint === null).should.be.true;
        setTimeout(() => {
          const progressBar = document.querySelector('.playkit-progress-bar');
          progressBar.lastElementChild.className.should.not.equals('playkit-cue-point-container');
          done();
        });
      } catch (e) {
        done(e);
      }
    });
  });

  describe('removeCuePoint', function () {
    it('Should remove the added cue point', function (done) {
      const cuePoint = player.ui.getManager('timeline').addCuePoint({
        time: 50
      });
      try {
        setTimeout(() => {
          const progressBar = document.querySelector('.playkit-progress-bar');
          progressBar.lastElementChild.className.should.equals('playkit-cue-point-container');
          player.ui.getManager('timeline').removeCuePoint(cuePoint);
          setTimeout(() => {
            progressBar.lastElementChild.className.should.not.equals('playkit-cue-point-container');
            done();
          });
        });
      } catch (e) {
        done(e);
      }
    });
  });

  describe('setSeekbarPreview', function () {
    it('Should override the seekbar preview with a simple div element', function (done) {
      player.ui.getManager('timeline').setSeekbarPreview({
        get: 'div',
        props: {
          key3: 'value3'
        },
        width: 100,
        height: 50,
        className: 'custom-preview'
      });
      try {
        setTimeout(() => {
          const framePreview = document.querySelector('.playkit-frame-preview');
          const customPreview = framePreview.lastElementChild;
          customPreview.className.should.equals('');
          customPreview.lastElementChild.className.should.equals('custom-preview');
          customPreview.lastElementChild.getAttribute('key3').should.equals('value3');
          customPreview.lastElementChild.style.width.should.equals('100px');
          customPreview.lastElementChild.style.height.should.equals('50px');
          (customPreview.lastElementChild.getAttribute('defaultPreviewProps') === null).should.be.true;
          player.ui._uiManager.store.getState().seekbar.hideTimeBubble.should.be.false;
          done();
        });
      } catch (e) {
        done(e);
      }
    });

    it('Should override the seekbar preview with preact component', function (done) {
      player.ui.getManager('timeline').setSeekbarPreview({
        get: customSeekbarPreview,
        props: {
          key3: 'value3'
        },
        width: 100,
        height: 50,
        className: 'custom-seekbar-preview',
        hideTime: true,
        sticky: false
      });
      try {
        setTimeout(() => {
          const framePreview = document.querySelector('.playkit-frame-preview');
          const customPreview = framePreview.lastElementChild;
          customPreview.className.should.equals('playkit-non-sticky');
          customPreview.lastElementChild.className.should.equals('custom-seekbar-preview');
          customPreview.lastElementChild.getAttribute('key3').should.equals('value3');
          customPreview.lastElementChild.style.width.should.equals('100px');
          customPreview.lastElementChild.style.height.should.equals('50px');
          customPreview.lastElementChild.getAttribute('defaultPreviewProps').should.exist;
          player.ui._uiManager.store.getState().seekbar.hideTimeBubble.should.be.true;
          done();
        });
      } catch (e) {
        done(e);
      }
    });

    it('Should restore the default seekbar preview', function (done) {
      const restoreFunc = player.ui.getManager('timeline').setSeekbarPreview({
        get: 'div',
        className: 'custom-preview',
        sticky: false
      });
      try {
        setTimeout(() => {
          const framePreview = document.querySelector('.playkit-frame-preview');
          framePreview.lastElementChild.className.should.equals('playkit-non-sticky');
          restoreFunc();
          setTimeout(() => {
            (framePreview.lastElementChild === null).should.be.true;
            done();
          }, 500);
        });
      } catch (e) {
        done(e);
      }
    });
  });
});
