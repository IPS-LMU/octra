export interface FuncObj {
  name: string;
  do: any;
}

export class TaskManager {
  private bloburl: string;
  private functions: FuncObj[];
  private worker: Worker;

  constructor(functions: FuncObj[]) {
    this.functions = functions;

    // prepare BLOB
    const start = Date.now();
    const blobURL = URL.createObjectURL(new Blob([
        this.getFunctionsString()
      ],
      {
        type: 'application/javascript'
      }
    ));
    this.worker = new Worker(blobURL);
    const end = Date.now();
  }

  /**
   * runs a specific function in the TM's worker.
   * @param {string} function_name
   * @param {any[]} args
   * @returns {Promise<any>}
   */
  public run(doFunction: () => any, args: any[]): Promise<any> {
    const start = Date.now();
    console.log(JSON.stringify(doFunction));
    return new Promise<any>(
      (resolve, reject) => {
        this.worker.onmessage = (ev) => {
          resolve(ev);
        };

        this.worker.onerror = (err) => {
          reject(err);
        };

        this.worker.postMessage({
          do: JSON.stringify(doFunction),
          args: args
        });
      }
    );
  }

  /**
   * destroys the Taskmanager if not needed anymore.
   */
  public destroy() {
    URL.revokeObjectURL(this.bloburl);
  }

  /**
   * checks if function exists.
   * @param {string} function_name
   * @returns {any}
   */
  public hasFunction(function_name: string): any {
    for (let i = 0; i < this.functions.length; i++) {
      if (this.functions[i].name === function_name) {
        return this.functions[i];
      }
    }
    return null;
  }

  /**
   * prepares the conjunction of all functions as string. Only needed in constructor.
   * @returns {string}
   */
  private getFunctionsString(): string {
    let result = '';

    result += `onmessage = function(msg) {
      var func = msg.data.do;
      var result = func(msg.data.args);
      self.postMessage(result);
    };`;
    return result;
  }
}
