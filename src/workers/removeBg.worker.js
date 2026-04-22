import { removeBackground } from '@imgly/background-removal';

self.onmessage = async ({ data: { buffer, mimeType } }) => {
  try {
    const inputBlob  = new Blob([buffer], { type: mimeType });
    const resultBlob = await removeBackground(inputBlob, { model: 'small', debug: false });
    const outBuffer  = await resultBlob.arrayBuffer();
    self.postMessage({ ok: true, buffer: outBuffer, type: resultBlob.type }, [outBuffer]);
  } catch (err) {
    self.postMessage({ ok: false, error: err.message });
  }
};
