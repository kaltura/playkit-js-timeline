import {loadPlayer, mockKalturaBe} from './utils';
import {customMarker, customPreview, customSeekbarPreview} from './components-helper';

const MANIFEST = `#EXTM3U
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",LANGUAGE="en",NAME="English",AUTOSELECT=YES,DEFAULT=YES,URI="${location.origin}/media/index_1.m3u8",SUBTITLES="subs"
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=509496,RESOLUTION=480x272,AUDIO="audio",SUBTITLES="subs"
${location.origin}/media/index.m3u8`;

const MANIFEST_SAFARI = `#EXTM3U
#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="English",DEFAULT=NO,AUTOSELECT=YES,FORCED=NO,LANGUAGE="en",URI="${location.origin}/media/index_1.m3u8"
#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=504265,RESOLUTION=480x272,AUDIO="audio",SUBTITLES="subs"
${location.origin}/media/index.m3u8`;

Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

describe('Timeline plugin', () => {
  beforeEach(() => {
    // manifest
    cy.intercept('GET', '**/a.m3u8*', Cypress.browser.name === 'webkit' ? MANIFEST_SAFARI : MANIFEST);
    // thumbnails
    cy.intercept('GET', '**/width/164/vid_slices/100', {fixture: '100.jpeg'});
    cy.intercept('GET', '**/height/360/width/640', {fixture: '640.jpeg'});
    // kava
    cy.intercept('**/index.php?service=analytics*', {});
    // go to test page
    cy.intercept('POST', 'http://mock-api/service/multirequest', {fixture: 'vod-entry.json'});
  });

  describe('addCuePoint', () => {
    it('Should add a default cue point with no preview', () => {
      mockKalturaBe();
      loadPlayer().then(player => {
        const cp = player.getService('timeline').addCuePoint({
          time: 50
        });
        expect(typeof cp.id === 'string');
        cy.get('[data-testid="cuePointContainer"]').should('exist').children().should('have.length', 1);
      });
    });

    it('Should add custom cue point with custom marker', () => {
      mockKalturaBe();
      loadPlayer().then(player => {
        const cp = player.getService('timeline').addCuePoint({
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
        expect(typeof cp.id === 'string');
        const markerEl = cy.get('[data-testid="cuePointContainer"]').children().first();
        markerEl.should('exist');
        markerEl.should('have.class', 'custom-marker-class');
        markerEl.should('have.css', 'width', '30px');
        markerEl.should('have.css', 'backgroundColor', 'rgb(255, 0, 0)');
        markerEl.should('have.attr', 'key1', 'value1');
      });
    });

    it('Should add custom cue point with custom preview', () => {
      mockKalturaBe();
      loadPlayer().then(player => {
        const cp = player.getService('timeline').addCuePoint({
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
        expect(typeof cp.id === 'string');
        const markerEl = cy.get('[data-testid="cuePointContainer"]').children().first();
        markerEl.should('exist');
        markerEl.should('have.class', 'custom-marker-class');
        markerEl.should('have.css', 'width', '30px');
        markerEl.should('have.css', 'backgroundColor', 'rgb(255, 0, 0)');

        const previewEl = cy.get('[data-testid="cuePointContainer"]').children().last();
        previewEl.should('exist');
        previewEl.should('have.class', 'playkit-non-sticky');
        previewEl.children().should('have.attr', 'key2', 'value2');
      });
    });

    it('Should not add and return null when is live', () => {
      mockKalturaBe();
      loadPlayer().then(player => {
        let state = player.ui._uiManager.store.getState();
        cy.stub(player.ui._uiManager.store, 'getState', () => {
          state.engine.isLive = true;
          state.engine.isDvr = true;
          return state;
        });
        const cuePoint = player.getService('timeline').addCuePoint({
          time: 50
        });
        expect(cuePoint === null);
        cy.get('[data-testid="cuePointContainer"]').should('not.exist');
      });
    });

    it('Should not add and return null when time is missing', () => {
      mockKalturaBe();
      loadPlayer().then(player => {
        const cuePoint1 = player.getService('timeline').addCuePoint();
        const cuePoint2 = player.getService('timeline').addCuePoint({});
        expect(cuePoint1 === null);
        expect(cuePoint2 === null);
        cy.get('[data-testid="cuePointContainer"]').should('not.exist');
      });
    });
  });

  describe('setSeekbarPreview', () => {
    it('Should override the seekbar preview with a simple div element', () => {
      mockKalturaBe();
      loadPlayer().then(player => {
        player.getService('timeline').setSeekbarPreview({
          get: 'div',
          props: {
            key3: 'value3'
          },
          width: 100,
          height: 50,
          className: 'custom-preview'
        });
        const framePreview = cy.get('.playkit-frame-preview');
        const customPreview = framePreview.children().last();
        customPreview.should('have.class', '');

        const customPreviewLastChild = cy.get('.playkit-frame-preview').children().last().children().last();
        customPreviewLastChild.should('have.class', 'custom-preview');
        customPreviewLastChild.should('have.css', 'width', '100px');
        customPreviewLastChild.should('have.css', 'height', '50px');
        customPreviewLastChild.should('have.attr', 'key3', 'value3');
        customPreviewLastChild.should('not.have.attr', 'defaultPreviewProps');
        expect(player.ui._uiManager.store.getState().seekbar.hideTimeBubble === false);
      });
    });

    it('Should override the seekbar preview with preact component', () => {
      mockKalturaBe();
      loadPlayer().then(player => {
        player.getService('timeline').setSeekbarPreview({
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
        const framePreview = cy.get('.playkit-frame-preview');
        const customPreview = framePreview.children().last();
        customPreview.should('have.class', 'playkit-non-sticky');

        const customPreviewLastChild = cy.get('.playkit-frame-preview').children().last().children().last();
        customPreviewLastChild.should('have.class', 'custom-seekbar-preview');
        customPreviewLastChild.should('have.css', 'width', '100px');
        customPreviewLastChild.should('have.css', 'height', '50px');
        customPreviewLastChild.should('have.attr', 'key3', 'value3');
        customPreviewLastChild.should('have.attr', 'defaultPreviewProps');
        expect(player.ui._uiManager.store.getState().seekbar.hideTimeBubble === true);
      });
    });

    it('Should restore the default seekbar preview', done => {
      mockKalturaBe();
      loadPlayer().then(player => {
        const restoreFunc = player.getService('timeline').setSeekbarPreview({
          get: 'div',
          className: 'custom-preview',
          sticky: false
        });
        const framePreview = cy.get('.playkit-frame-preview');
        const customPreview = framePreview.children().last();
        customPreview.should('have.class', 'playkit-non-sticky').then(() => {
          restoreFunc();
          setTimeout(() => {
            cy.get('.playkit-frame-preview').children().last().should('be.null');
            done();
          }, 500);
        });
      });
    });
  });

  describe('Advanced Timeline', () => {
    it('Should create a marker with hotspot and chapter', done => {
      mockKalturaBe();
      loadPlayer().then(player => {
        const timelineService = player.getService('timeline');
        timelineService.addKalturaCuePoint(10, 'Chapter', '2', 'Chapter 1');
        timelineService.addKalturaCuePoint(10, 'Hotspot', '1');
        setTimeout(() => {
          cy.get('[data-testid="cuePointMarkerContainer"]').should('exist');
          cy.get('[data-testid="cuePointPreviewHeaderItems"]').children().should('have.length', 2);
          cy.get('[data-testid="cuePointPreviewHeaderItems"]').children().first().should('have.text', 'Chapter 1');
          cy.get('[data-testid="cuePointPreviewHeaderItems"]').children().last().should('have.text', 'Hotspot');
          done();
        }, 200);
      });
    });

    it('Should display the marker preview if focusing on the marker', () => {
      mockKalturaBe();
      loadPlayer().then(player => {
        const timelineService = player.getService('timeline');
        cy.stub(timelineService.timelineManager, '_isDurationCorrect', () => true);
        timelineService.addKalturaCuePoint(10, 'Hotspot', '1');
        cy.get('[data-testid="cuePointContainer"]').should('exist');
        cy.wait(1000);
        cy.get('[data-testid="cuePointMarkerContainer"]').focus();
        cy.get('[data-testid="cuePointPreviewContainer"]').parent().should('have.css', 'display', 'block');
      });
    });

    it('Should not create a marker if only chapter exists', () => {
      mockKalturaBe();
      loadPlayer().then(player => {
        const timelineService = player.getService('timeline');
        timelineService.addKalturaCuePoint(10, 'Chapter', '2', 'Chapter 1');
        cy.get('[data-testid="cuePointMarkerContainer"]').should('not.exist');
      });
    });

    it('Should add segments to seekbar', () => {
      mockKalturaBe();
      loadPlayer().then(player => {
        const timelineService = player.getService('timeline');
        cy.stub(timelineService.timelineManager, '_isDurationCorrect', () => true);
        timelineService.addKalturaCuePoint(0, 'Chapter', '1', 'Chapter 1');
        timelineService.addKalturaCuePoint(18, 'Chapter', '2', 'Chapter 2');
        cy.get('[data-testid="segmentsWrapper"]').should('exist');
        cy.get('[data-testid="segmentsWrapper"]').children().should('have.length', 2);
      });
    });

    it('Should add a dummy segment', () => {
      mockKalturaBe();
      loadPlayer().then(player => {
        const timelineService = player.getService('timeline');
        cy.stub(timelineService.timelineManager, '_isDurationCorrect', () => true);
        timelineService.addKalturaCuePoint(10, 'Chapter', '1', 'Chapter 1');
        timelineService.addKalturaCuePoint(18, 'Chapter', '2', 'Chapter 2');
        cy.get('[data-testid="segmentsWrapper"]').should('exist');
        cy.get('[data-testid="segmentsWrapper"]').children().should('have.length', 3);
      });
    });

    it('Should test preview header for dummy segment', done => {
      mockKalturaBe();
      loadPlayer().then(player => {
        const timelineService = player.getService('timeline');
        cy.stub(timelineService.timelineManager, '_isDurationCorrect', () => true);
        timelineService.addKalturaCuePoint(10, 'Chapter', '1', 'Chapter 1');
        timelineService.addKalturaCuePoint(18, 'Chapter', '2', 'Chapter 2');
        cy.get('[data-testid="segmentsWrapper"]').should('exist');
        cy.get('[data-testid="segmentsWrapper"]').children().should('have.length', 3);

        // dummy chapter should not have preview header
        cy.get('[data-testid="segmentsWrapper"]')
          .children()
          .first()
          .trigger('mouseover', {force: true})
          .then(() => {
            cy.get('[data-testid="cuePointPreviewHeader"]').should('not.exist');
            cy.get('[data-testid="segmentsWrapper"]')
              .children()
              .first()
              .trigger('mouseleave', {force: true})
              .then(() => done());
          });
      });
    });

    it('Should test preview header for a non-dummy segment', done => {
      mockKalturaBe();
      loadPlayer().then(player => {
        const timelineService = player.getService('timeline');
        cy.stub(timelineService.timelineManager, '_isDurationCorrect', () => true);
        timelineService.addKalturaCuePoint(0, 'Chapter', '1', 'Chapter 1');
        timelineService.addKalturaCuePoint(18, 'Chapter', '2', 'Chapter 2');
        cy.get('[data-testid="segmentsWrapper"]').should('exist');
        cy.get('[data-testid="segmentsWrapper"]').children().should('have.length', 2);

        // non-dummy chapter should have preview header with the chapter's title
        cy.get('[data-testid="segmentsWrapper"]')
          .children()
          .first()
          .trigger('mouseover', {force: true})
          .then(() => {
            cy.get('[data-testid="cuePointPreviewHeader"]').should('exist');
            cy.get('[data-testid="cuePointPreviewHeaderItems"]').should('exist').should('have.text', 'Chapter 1');
            cy.get('[data-testid="segmentsWrapper"]')
              .children()
              .first()
              .trigger('mouseleave', {force: true})
              .then(() => done());
          });
      });
    });

    it('Should trigger callback method on previes click', done => {
      mockKalturaBe();
      loadPlayer().then(player => {
        const timelineService = player.getService('timeline');
        cy.stub(timelineService.timelineManager, '_isDurationCorrect', () => true);
        const callback = cy.stub();
        timelineService.addKalturaCuePoint(10, 'Hotspot', '1', 'Hotspot 1', {onClick: callback});
        cy.get('[data-testid="cuePointContainer"]').should('exist');
        cy.wait(1000);
        cy.get('[data-testid="cuePointMarkerContainer"]').focus();
        cy.get('[data-testid="cuePointPreviewHeaderTitle"]').should('have.text', 'Hotspot');
        cy.get('[data-testid="cuePointPreviewHeaderTitle"]')
          .click({force: true})
          .then(() => {
            expect(callback).to.have.been.called;
            done();
          });
      });
    });
  });

  describe('removeCuePoint', () => {
    it('Should remove the added cue point', done => {
      mockKalturaBe();
      loadPlayer().then(player => {
        const cuePoint = player.getService('timeline').addCuePoint({
          time: 50
        });
        const markerEl = cy.get('[data-testid="cuePointContainer"]');
        markerEl.should('exist').then(() => {
          player.getService('timeline').removeCuePoint(cuePoint);
          setTimeout(() => {
            markerEl.should('not.exist');
            done();
          }, 500);
        });
      });
    });

    it('Should remove all added cue points', done => {
      mockKalturaBe();
      loadPlayer().then(player => {
        const timelineService = player.getService('timeline');
        cy.stub(timelineService.timelineManager, '_isDurationCorrect', () => true);
        timelineService.addKalturaCuePoint(0, 'Chapter', '1', 'Chapter 1');
        timelineService.addKalturaCuePoint(18, 'Chapter', '2', 'Chapter 2');
        cy.get('[data-testid="segmentsWrapper"]').children().should('have.length', 2);
        timelineService.removeAllKalturaCuePoints();
        setTimeout(() => {
          cy.get('[data-testid="segmentsWrapper"]').children().should('have.length', 0);
          done();
        }, 500);
      });
    });
  });

  describe('dual-screen timeline preview', () => {
    it('Should test single preview on segments', () => {
      mockKalturaBe();
      loadPlayer().then(player => {
        const timelineService = player.getService('timeline');
        timelineService.setGetThumbnailInfo((time: number) => player.getThumbnail(time));
        cy.stub(timelineService.timelineManager, '_isDurationCorrect', () => true);
        timelineService.addKalturaCuePoint(10, 'Chapter', '1', 'Chapter 1');
        cy.get('[data-testid="cuePointPreviewImageContainer"]').children().should('have.length', 1);
      });
    });
    it('Should test dual preview on segments', () => {
      mockKalturaBe();
      loadPlayer().then(player => {
        const timelineService = player.getService('timeline');
        timelineService.setGetThumbnailInfo((time: number) => [player.getThumbnail(time), player.getThumbnail(time)]);
        cy.stub(timelineService.timelineManager, '_isDurationCorrect', () => true);
        timelineService.addKalturaCuePoint(10, 'Chapter', '1', 'Chapter 1');
        cy.get('[data-testid="cuePointPreviewImageContainer"]').children().should('have.length', 2);
      });
    });
    it('Should test dual preview', () => {
      mockKalturaBe();
      loadPlayer().then(player => {
        const timelineService = player.getService('timeline');
        timelineService.setGetThumbnailInfo((time: number) => [player.getThumbnail(time), player.getThumbnail(time)]);
        timelineService.addSeekBarPreview();
        cy.get('[data-testid="cuePointPreviewImageContainer"]').children().should('have.length', 2);
      });
    });
  });
});
