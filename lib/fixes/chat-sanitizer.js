'use strict';

function sanitize(event) {
  if (typeof event.message !== 'string' || !event.message.includes('<')) return;
  const cleaned = event.message.replace(/<[^>]*>/g, tag => {
    const inner = tag.slice(1, -1);
    const allowed = /^\/?font$/i.test(inner) ||
      /^font (face="\$chatfont" size="18" )?color="#[0-9a-f]{1,6}"( kerning="0")?$/i.test(inner) ||
      /^\/ChatLinkAction$/i.test(inner) || /^ChatLinkAction param="[^"<>\r\n]+"$/i.test(inner);
    return allowed ? tag : '';
  });
  if (cleaned !== event.message) { event.message = cleaned; return true; }
}
module.exports = function ChatSanitizer(mod, scope) {
  const options = { order: 10, filter: { fake: false, modified: null, silenced: false } };
  for (const name of ['S_CHAT', 'S_WHISPER', 'S_PRIVATE_CHAT']) scope.hook(name, '*', options, sanitize);
};
