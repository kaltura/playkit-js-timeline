const getPlayer = () => {
  // @ts-ignore
  return cy.window().then($win => $win.KalturaPlayer.getPlayers()['player-placeholder']);
};

const preparePage = (pluginConf = {}, playbackConf = {}) => {
  cy.visit('index.html');
  return cy.window().then(win => {
    try {
      // @ts-ignore
      var kalturaPlayer = win.KalturaPlayer.setup({
        targetId: 'player-placeholder',
        provider: {
          partnerId: -1,
          env: {
            cdnUrl: 'http://mock-cdn',
            serviceUrl: 'http://mock-api'
          }
        },
        playback: {muted: true, autoplay: true, ...playbackConf},
        plugins: {
          timeline: {}
        }
      });
      return kalturaPlayer.loadMedia({entryId: '0_wifqaipd'});
    } catch (e: any) {
      return Promise.reject(e.message);
    }
  });
};

export const loadPlayer = (pluginConf = {}, playbackConf = {}) => {
  return preparePage(pluginConf, playbackConf).then(() => getPlayer().then(kalturaPlayer => kalturaPlayer.ready().then(() => kalturaPlayer)));
};

const checkRequest = (reqBody: any, service: string, action: string) => {
  return reqBody?.service === service && reqBody?.action === action;
};

export const mockKalturaBe = (entryFixture = 'vod-entry.json') => {
  cy.intercept('http://mock-api/service/multirequest', req => {
    if (checkRequest(req.body[2], 'baseEntry', 'list')) {
      return req.reply({fixture: entryFixture});
    }
  });
  cy.intercept('GET', '**/ks/123', {fixture: 'thumb-asset.jpeg'}).as('getSlides');
  cy.intercept('GET', '**/vid_sec/*', {fixture: 'thumb-asset.jpeg'}).as('getChapters');
};
