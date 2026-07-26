// Test files, "vendor"/node_modules files (karma-qunit's adapter, qunit
// itself, ...), and everything else karma serves (framework HTML, etc.) are
// distinguished by prefix so `test-execution-service.js` knows which served
// files it actually needs to fetch and eval - see `getScriptType`.
const TYPE_TEST = 0;
const TYPE_OTHER = 1;
const TYPE_NODE_MODULE = 2;

export class KarmaFilesService {
  constructor(http, config) {
    this.http = http;
    this.extensionRegex = /\.([^./]+)$/;
    this.testsPrefix = `/base/${config.options.appDirectoryRelativePath}/tests`;
    this.absoluteTestsPrefix = `/absolute`;
    this.nodeModulesPrefix = `/base/node_modules/`;
  }

  getServedFilesData(baseUrl) {
    const contextUrl = `${baseUrl}/context.json`;
    console.log('NSUTR: downloading ' + contextUrl);
    return this.http
      .getString(contextUrl)
      .then((content) => JSON.parse(content).files)
      .then((scriptUrls) =>
        Promise.all(
          scriptUrls.map((url) => {
            const { extension, type } = this.getScriptData(url);
            return this.http.getString(baseUrl + url).then((contents) => ({
              url,
              type,
              contents,
              shouldEval: !extension || extension.toLowerCase() === 'js' || extension.toLowerCase() === 'ts',
            }));
          }),
        ),
      );
  }

  getScriptData(url) {
    const queryStringStartIndex = url.lastIndexOf('?');
    const pathWithoutQueryString = url.substring(0, queryStringStartIndex);
    const extension = this.extensionRegex.exec(pathWithoutQueryString)?.[1];
    return { extension, type: this.getScriptType(url) };
  }

  getScriptType(url) {
    if (url.startsWith(this.testsPrefix) || url.startsWith(this.absoluteTestsPrefix)) {
      return TYPE_TEST;
    }
    if (url.startsWith(this.nodeModulesPrefix)) {
      return TYPE_NODE_MODULE;
    }
    return TYPE_OTHER;
  }
}

export { TYPE_TEST, TYPE_OTHER, TYPE_NODE_MODULE };
