export class MimeTypeMapper {
  static mapTypeToExtension(mimetype: string) {
    const matches = /([^/]+)\/(.+)/g.exec(mimetype);
    if (!matches || matches.length < 3) {
      return undefined;
    }

    const [media, type] = matches.slice(1);

    if (media === 'audio') {
      if (['mpeg', 'mp3', 'mpeg3'].includes(type)) {
        return '.mp3';
      } else if (
        ['vnd.wav', 'vnd.wave', 'wav', 'wave', 'x-pn-wav', 'x-wav'].includes(
          type,
        )
      ) {
        return '.wav';
      } else if (['flac'].includes(type)) {
        return '.flac';
      } else if (['ogg'].includes(type)) {
        return '.ogg';
      } else if (['mp4', 'm4a'].includes(type)) {
        return '.m4a';
      }
    } else if (media === 'text') {
      if (['plain'].includes(type)) {
        return '.txt';
      } else if (['vtt'].includes(type)) {
        return '.vtt';
      } else if (['praat-textgrid'].includes(type)) {
        return '.TextGrid';
      } else if (['application/json'].includes(type)) {
        return '_annot.json';
      }
    }

    return undefined;
  }
}
