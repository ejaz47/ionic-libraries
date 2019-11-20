import { InjectionToken } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpXhrBackend } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { Storage } from '@ionic/storage';
import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { File } from '@ionic-native/file/ngx';
import { Zip } from '@ionic-native/zip/ngx';


export class HotUpdate {

  constructor(public config: UpdateConfig, 
	  			    public storage: Storage,
	  			    public http: HttpClient, 
							public transfer: FileTransfer,
							public zip: Zip,
							public file: File
				) {

  	this.json_url = this.config.url;
	}

  setApi(){
  	return this.storage.set('name', 'Ejaz');
  }

  getApi(){
  	return this.storage.get('name');
  }

  private json_url: string;
  private fileTransfer: FileTransferObject = this.transfer.create();
  
  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  }

  httpParams: any = {
  	// 'current_version': this.installed_version
  };

  private initialize(){

  }

  isUpdateAvailable(): Promise<boolean>{
  	return new Promise( async (resolve, reject) => {

  		let local = await this.storage.get('zip_updator_data');
  		
  		// console.log('+================== ', local);
  		if(!local){
  			local = {};
  		}

  		local.version = local.version ? parseInt(local.version) : 0;

  		this.checkUpdate().subscribe(resp => {
  			if(resp.version){
  				// wether installed version is smaller than version
  				local.version < parseInt(resp.version) ?
  					resolve(true) : resolve(false);
  				return;
  			}else{
					reject(new Error('server JSON is not valid'));
  			}
  		}, err =>{
  			reject(err);
  		});
  	});
  }

  updateNow(): Promise<any>{
  	return new Promise((resolve, reject) => {
  		this.checkUpdate().subscribe(resp => {
  			if(resp.version){

			  	this.fileTransfer.download(resp.zip_url, this.file.dataDirectory + 'web.zip', true).then((entry) => {
				    console.log('download complete: ' + entry.toURL());

				    // unzip 
				    this.zip.unzip(this.file.dataDirectory + 'web.zip', this.file.dataDirectory + 'web', (progress) => console.log('Unzipping, ' + Math.round((progress.loaded / progress.total) * 100) + '%'))
						.then( async (result) => {

						  if(result === 0){
						  	// done
						  	await this.storage.set('zip_updator_data', resp);
						  	resolve(true);
						  }else{
						  	// faild
						  	reject('Error while unzipping.');
						  }
						});

				  }, (error) => {
						// file transfer err
				    reject(error);
				  });
  			}else{
  				reject('invalid server json');
  			}

		  }, err =>{
				// get server json err
  			reject(err);
  		});
	  });
  }

  // private methods
 	private checkUpdate(): Observable<any>{
    return this.http
      .get(this.json_url, this.httpParams)
      .pipe(
        retry(2),
        catchError(this.handleError)
      )
  }

  // Handle API errors
  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.message}`);
    }
    // return an observable with a user-facing error message
    return throwError('Error while http request.');
  };

}






/** @hidden */
export function getDefaultConfig() {
  return {
    url: 'localhost:8080/zip_config.json',
  };
}

/** @hidden */
export interface UpdateConfig {
  url?: string;
}

/** @hidden */
export const updateConfigToken = new InjectionToken<any>(
  'UPDATE_CONFIG_TOKEN'
);

/** @hidden */
export function provideUpdate(updateConfig: UpdateConfig): HotUpdate {
  const config = !!updateConfig ? updateConfig : getDefaultConfig();
  return new HotUpdate(
  				config, 
  				new Storage({}), 
  				new HttpClient(new HttpXhrBackend({ build: () => new XMLHttpRequest() })),
  				new FileTransfer(),
  				new Zip(),
  				new File()
  				);
}



