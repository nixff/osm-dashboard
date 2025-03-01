// Copyright 2017 The Kubernetes Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {HTTP_INTERCEPTORS} from '@angular/common/http';
import {APP_INITIALIZER, Injector, NgModule} from '@angular/core';
import {DecoderService} from '@common/services/global/decoder';
import {LocalConfigLoaderService} from '@common/services/global/loader';

import {ActionbarService} from './actionbar';
import {AssetsService} from './assets';
import {AuthService} from './authentication';
import {AuthorizerService} from './authorizer';
import {ConfigService} from './config';
import {CsrfTokenService} from './csrftoken';
import {GlobalSettingsService} from './globalsettings';
import {HistoryService} from './history';
import {AuthInterceptor} from './interceptor';
import {LocalSettingsService} from './localsettings';
import {LogService} from './logs';
import {NamespaceService} from './namespace';
import {NotificationsService} from './notifications';
import {ParamsService} from './params';
import {KdStateService} from './state';
import {ThemeService} from './theme';
import {TitleService} from './title';
import {VerberService} from './verber';
import {JaegerService} from './jaeger';
import {PrometheusService} from './prometheus';
import {PluginsConfigService} from './plugin';
import {PluginLoaderService} from '../pluginloader/pluginloader.service';
import {ClientPluginLoaderService} from '../pluginloader/clientloader.service';
import {PinnerService} from './pinner';

@NgModule({
  providers: [
    AuthorizerService,
    AssetsService,
    LocalSettingsService,
    GlobalSettingsService,
    ConfigService,
    PluginsConfigService,
    TitleService,
    AuthService,
    CsrfTokenService,
    NotificationsService,
    ThemeService,
    KdStateService,
    NamespaceService,
    ActionbarService,
    VerberService,
		JaegerService,
    PinnerService,
    HistoryService,
    LogService,
    ParamsService,
    LocalConfigLoaderService,
    DecoderService,
		PrometheusService,
    {
      provide: APP_INITIALIZER,
      useFactory: init,
      deps: [
        GlobalSettingsService,
        LocalSettingsService,
        ConfigService,
        HistoryService,
        PluginsConfigService,
        PinnerService,
        ThemeService,
        LocalConfigLoaderService,
      ],
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {provide: PluginLoaderService, useClass: ClientPluginLoaderService},
  ],
})
export class GlobalServicesModule {
  static injector: Injector;
  constructor(injector: Injector) {
    GlobalServicesModule.injector = injector;
  }
}

export function init(
  globalSettings: GlobalSettingsService,
  localSettings: LocalSettingsService,
  pinner: PinnerService,
  config: ConfigService,
  history: HistoryService,
  pluginsConfig: PluginsConfigService,
  theme: ThemeService,
  loader: LocalConfigLoaderService
): Function {
  return () => {
    return loader.init().then(() => {
      localSettings.init();
      pinner.init();
      config.init();
      history.init();
      theme.init();
      return globalSettings.init().then(() => pluginsConfig.init());
    });
  };
}
