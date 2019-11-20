import { NgModule, ModuleWithProviders } from '@angular/core';
import { getDefaultConfig, HotUpdate, provideUpdate, UpdateConfig, updateConfigToken} from './hot-update.service';


export { UpdateConfig, updateConfigToken, HotUpdate };

@NgModule()
export class HotUpdateModule {
	static forRoot(storageConfig: UpdateConfig = null): ModuleWithProviders {
    return {
      ngModule: HotUpdateModule,
      providers: [
        { provide: updateConfigToken, useValue: storageConfig },
        {
          provide: HotUpdate,
          useFactory: provideUpdate,
          deps: [updateConfigToken]
        }
      ]
    };
  }
}
