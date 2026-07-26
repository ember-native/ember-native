export class KarmaHostResolver {
  constructor(http) {
    this.http = http;
  }

  resolveKarmaHost(ips, port) {
    return new Promise((resolve) => {
      let foundKarma = false;
      const resolvers = ips.map((ip) => {
        const karmaClientUrl = `http://${ip}:${port}/context.json`;
        console.log(`NSUTR: fetching ${karmaClientUrl}`);
        return this.http
          .getString({
            url: karmaClientUrl,
            method: 'GET',
            timeout: 3000,
          })
          .then(
            () => {
              console.log(`NSUTR: found karma at ${ip}`);
              if (!foundKarma) {
                foundKarma = true;
                resolve(ip);
              }
            },
            (err) => {
              console.log(`NSUTR: error fetching ${karmaClientUrl}`, err);
              return undefined;
            },
          );
      });
      Promise.all(resolvers).then(() => {
        if (!foundKarma) {
          resolve(null);
        }
      });
    });
  }
}
