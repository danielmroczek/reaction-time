export class DeepLinking {
  constructor() {
    this.types = {
      "s": "success",
      "f": "false-start"
    };
    this.splitChr = ',';
  }

  getState() {
    try {
      const hash = window.location.hash.substr(2);
      if (!hash) {
        console.warn('No hash found in URL.');
        return null;
      }

      const csv = atob(hash);
      console.log('Decoded CSV from hash:', csv);
      return this.decodeScore(csv);
    } catch (e) {
      console.error('Error decoding deep link:', e);
      return null;
    }
  }

  saveState(score) {
    const scoreStr = this.encodeScore(score);
    const base = btoa(scoreStr);
    window.location.hash = `!${base}`;
    console.log('Saved state with hash:', window.location.hash);
  }

  clearState() {
    window.location.hash = '';
    console.log('Cleared deep link state.');
  }

  encodeScore(score) {
    if (!score.date) {
      console.warn('Score object missing date. Assigning current date.');
      score.date = Date.now();
    }

    const data = [
      score.date.toString(),
      score.results.length.toString(),
      ...score.results.flatMap(result => {
        const type = result.type.substr(0, 1).toLowerCase();
        return [
          this.types[type] ? type : 's',
          result.time.toString()
        ];
      }),
      score.avg.toString()
    ];

    const output = data.join(this.splitChr);
    console.log('Encoded Score:', output);
    return output;
  }

  decodeScore(score) {
    try {
      const data = score.split(this.splitChr);
      if (data.length < 3) {
        throw new Error('Insufficient data to decode score.');
      }

      const date = parseInt(data.shift(), 10);
      if (isNaN(date)) {
        throw new Error('Invalid date format.');
      }

      const rounds = parseInt(data.shift(), 10);
      if (isNaN(rounds) || rounds < 1) {
        throw new Error('Invalid number of rounds.');
      }

      const results = Array.from({ length: rounds }, () => {
        const type = this.types[data.shift()] || 'unknown';
        const time = parseFloat(data.shift()) || 0;
        return { type, time };
      });

      const avg = parseFloat(data.shift()) || 0;

      const obj = { date, results, avg };
      console.log('Decoded Score Object:', obj);
      return obj;
    } catch (e) {
      console.error('Error decoding score:', e);
      return null;
    }
  }
}
