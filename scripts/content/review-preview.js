import { validateContentDocument } from './content-document.js';

const noop = () => {};
const defaultChannelFactory = (name) => new BroadcastChannel(name);

function isContentMessage(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value).sort();
  if (keys.length !== 2 || keys[0] !== 'document' || keys[1] !== 'type') return false;
  return value.type === 'content-document' && validateContentDocument(value.document).valid;
}

export function createReviewPublisher({
  channelName,
  channelFactory = defaultChannelFactory,
}) {
  if (!channelName) throw new TypeError('A review channel name is required');
  const channel = channelFactory(channelName);
  let closed = false;
  return {
    publish(document) {
      if (closed) return;
      channel.postMessage({
        type: 'content-document',
        document: structuredClone(document),
      });
    },
    close() {
      if (closed) return;
      closed = true;
      channel.close();
    },
  };
}

export function connectReviewPreview({
  location,
  contentStore,
  channelFactory = defaultChannelFactory,
  channelName,
}) {
  const parameters = new URLSearchParams(location.search);
  const requestedChannel = parameters.get('channel');
  if (
    parameters.get('reviewPreview') !== '1'
    || !requestedChannel
    || (channelName && channelName !== requestedChannel)
  ) return noop;

  const channel = channelFactory(requestedChannel);
  const receive = (event) => {
    if (!isContentMessage(event.data)) return;
    try {
      contentStore.replace(event.data.document);
    } catch {
      // Malformed review messages never disturb the current preview snapshot.
    }
  };
  channel.addEventListener('message', receive);
  let closed = false;
  return () => {
    if (closed) return;
    closed = true;
    channel.removeEventListener('message', receive);
    channel.close();
  };
}
