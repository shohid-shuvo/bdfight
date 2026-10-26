const en = {
  title: 'Neon Dojo Tournament',
  setupNotice: 'Phase 0 setup preview — gameplay is not implemented yet.',
  rendererReady: 'RENDERER READY',
  placeholderNotice: 'Original-IP placeholders only',
  checkServer: 'Check server',
  serverChecking: 'Checking…',
  serverReady: 'Server ready',
  serverUnavailable: 'Server unavailable — start npm run dev:server',
};

export function t(key) {
  return en[key] ?? key;
}
