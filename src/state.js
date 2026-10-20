import { SETTINGS } from './data.js';

const state = {
  user: null, screen: 'overview', loading: false, refreshing: false, navOpen: false, menu: null,
  login: { role: '', pw: '', show: false, err: {}, busy: false },
  gq: '', af: { q: '', sev: 'all', status: 'all', source: 'all', assignee: 'all', mine: false, sort: 'time', dir: 'desc' },
  alertId: null, invTab: 'timeline', reviewed: {}, invMsg: null,
  incId: null, incFilter: 'open', statusDraft: '', noteDraft: '', noteErr: '', incMsg: null,
  repTab: 'trends', repRange: '30', repSev: 'all', repSrc: 'all', running: null,
  adminTab: 'users', auditFilter: 'all', srcResult: {}, testing: {}, settingsDraft: Object.assign({}, SETTINGS), adminMsg: null,
  ovMsg: null, queueMsg: null, modal: null, toasts: [],
};

export { state };
