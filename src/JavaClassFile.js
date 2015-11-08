import JavaFile from './JavaFile';

const Buffer = global.BrowserFS.BFSRequire('buffer').Buffer;
const path   = global.BrowserFS.BFSRequire('path');

class JavaClassFile extends JavaFile {
  constructor(javaPoly, script) {
    super(javaPoly, script);

    let scriptSrc = script.src;

    let promise = new Promise((resolve, reject) => {
      let xmlr = new XMLHttpRequest();
      xmlr.open('GET', scriptSrc, true);
      xmlr.responseType = 'arraybuffer';
      xmlr.onreadystatechange = ()=> {
        if (xmlr.readyState === 4) {
          if (xmlr.status === 200) {
            let classFile = path.basename(scriptSrc);
            this.javaPoly.fs.writeFile(path.join(this.javaPoly.storageDir, classFile),
              new Buffer(xmlr.response), (err) => {
                if (err) {
                  this.javaPoly.analysingHub.push(
                    this.analyseClass(path.basename(classFile, '.class'))
                  );                  
                  reject();
                } else {
                  resolve();
                }
              }
            );
          } else {
            reject();
          }
        }
      }
      xmlr.send(null);
    });
    this.javaPoly.loadingHub.push(promise);
  }

  /**
   * Analyse java-class and return promise of this
   * @param  {String} className – name of the class (without '.class')
   * @param  {String} package   - package of the class (can be empty)
   * @return {Promise}          - promise of this job
   */
  analyseClass(className, packageName = '') {
    return new Promise((resolve, reject) => {
      console.log(className);
      resolve();
    });
  }
}

export default JavaClassFile;