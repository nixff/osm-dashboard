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

import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from '@angular/common/http';
import {EventEmitter, Injectable, Inject} from '@angular/core';
import {ObjectMeta, TypeMeta} from '@api/root.api';
import {GlobalSettingsService} from '../global/globalsettings';
import {publishReplay, refCount, switchMap, switchMapTo} from 'rxjs/operators';
import {timer, Subject} from 'rxjs';

import {JaegerResource} from '../../resources/jaegerresource';


@Injectable()
export class JaegerService {
  onJaegerChange = new Subject<void>();
  onTraceChange = new Subject<void>();

  constructor(
		private readonly http_: HttpClient,
		private readonly settings_: GlobalSettingsService
		// private readonly csrfToken_: CsrfTokenService,
	) {}

	doJaegerChange(): void {
		this.onJaegerChange.next();
	}
	doTraceChange(): void {
		this.onTraceChange.next();
	}
	getServicePath(objectMeta: ObjectMeta) {
		const endTs = new Date().getTime();
		const lookback = 604800000;
		const url = JaegerResource.getUrl(objectMeta, `dependencies?endTs=${endTs}&lookback=${lookback}`);
		
		return this.http_.get(url, {responseType: 'text'});
	}
	getTraceList(service:string, objectMeta: ObjectMeta, params?: HttpParams) {
		const endTs = new Date().getTime();
		const lookback = 604800000;
		const url = JaegerResource.getUrl(objectMeta, `traces?end=${endTs*1000}&limit=50&lookback=1h&maxDuration&minDuration&service=${service}&start=${endTs*1000-lookback*1000}`);

		return this.settings_.onSettingsUpdate
		  .pipe(
		    switchMap(() => {
		      let interval = this.settings_.getResourceAutoRefreshTimeInterval();
		      interval = interval === 0 ? undefined : interval * 1000;
		      return timer(0, interval);
		    })
		  )
		  .pipe(switchMapTo(this.http_.get(url, {responseType: 'text',params})))
		  .pipe(publishReplay(1))
		  .pipe(refCount());
	}

  getHttpHeaders_(): HttpHeaders {
    const headers = new HttpHeaders();
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    return headers;
  }
}
