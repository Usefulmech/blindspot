export async function fetchSSE(
  url: string,
  options: RequestInit,
  onEvent: (event: string, data: string) => void
) {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  if (!response.body) {
    throw new Error('ReadableStream not yet supported in this browser.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    
    let boundary = buffer.indexOf('\n\n');
    if (boundary === -1) {
      boundary = buffer.indexOf('\r\n\r\n');
    }

    while (boundary !== -1) {
      const block = buffer.slice(0, boundary);
      const isCRLF = buffer.substr(boundary, 4) === '\r\n\r\n';
      buffer = buffer.slice(boundary + (isCRLF ? 4 : 2));

      const lines = block.split(/\r?\n/);
      let eventName = 'message';
      let data = '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventName = line.substring(6).trim();
        } else if (line.startsWith('data:')) {
          // If there are multiple data lines, they are concatenated
          data += line.substring(5).trim() + '\n';
        }
      }

      data = data.trim();
      if (eventName && data) {
        onEvent(eventName, data);
      }

      boundary = buffer.indexOf('\n\n');
      if (boundary === -1) {
        boundary = buffer.indexOf('\r\n\r\n');
      }
    }
  }
}
