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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router,NavigationExtras,ActivatedRoute} from '@angular/router';
import {ActionbarService, ResourceMeta} from '@common/services/global/actionbar';
import {NotificationsService} from '@common/services/global/notifications';
import {EndpointManager, Resource} from '@common/services/resource/endpoint';
import {NamespacedResourceService} from '@common/services/resource/resource';
import {NamespaceService} from '@common/services/global/namespace';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {GroupedResourceList} from '@common/resources/groupedlist';
import {GlobalServicesModule} from '@common/services/global/module';
import {KdStateService} from '@common/services/global/state';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {RawResource} from '@common/resources/rawresource';
import {AlertDialogConfig, AlertDialog} from 'common/dialogs/alert/dialog';
import {MatDialogConfig, MatDialog} from '@angular/material/dialog';
import lodash from 'lodash';
import {
	MeshconfigDetail,
  Namespace,
  NamespaceList,
} from '@api/root.api';

@Component({
  selector: 'kd-mesh-detail',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
})
export class MeshDetailComponent extends GroupedResourceList implements OnInit, OnDestroy {
  meshconfig: MeshconfigDetail;
  namespaces: any;
  isInitialized = false;
  podListEndpoint: string;
  serviceListEndpoint: string;
	namespaceListEndpoint: string;
  eventListEndpoint: string;
	logLevels = [{value:'error',label:'Error'},{value:'info',label:'Info'}];

  private readonly kdState_: KdStateService = GlobalServicesModule.injector.get(KdStateService);
  private readonly endpoint_ = EndpointManager.resource(Resource.meshconfig, true);
  private readonly unsubscribe_ = new Subject<void>();

  constructor(
		private router: Router,
    private readonly http_: HttpClient,
    private readonly dialog_: MatDialog,
    private readonly namespace_: NamespaceService,
    private readonly service_: NamespacedResourceService<MeshconfigDetail>,
    private readonly actionbar_: ActionbarService,
    private readonly activatedRoute_: ActivatedRoute,
    private readonly notifications_: NotificationsService
  ) {
		super();
	}

  ngOnInit(): void {
    const resourceName = this.activatedRoute_.snapshot.params.resourceName;
    const resourceNamespace = this.activatedRoute_.snapshot.params.resourceNamespace;

    this.podListEndpoint = this.endpoint_.child(resourceName, Resource.pod, resourceNamespace);
    this.serviceListEndpoint = this.endpoint_.child(resourceName, Resource.service, resourceNamespace);
		this.namespaceListEndpoint = this.endpoint_.child(resourceName, Resource.namespace, resourceNamespace);
    this.eventListEndpoint = this.endpoint_.child(resourceName, Resource.event, resourceNamespace);

    this.service_
      .get(this.endpoint_.detail(), resourceName, resourceNamespace)
      .pipe(takeUntil(this.unsubscribe_))
      .subscribe((d: MeshconfigDetail) => {
        this.meshconfig = d;
        this.notifications_.pushErrors(d.errors);
        this.actionbar_.onInit.emit(new ResourceMeta('Meshconfig', d.objectMeta, d.typeMeta));
        this.isInitialized = true;
      });
		this.loadNamespace();
  }
	
	loadNamespace(): void {
		this.http_.get('api/v1/namespace').subscribe((result: NamespaceList) => {
			this.namespaces = result.namespaces.filter((n)=>{
				return !n.objectMeta.labels['openservicemesh.io/monitored-by'];
			});
		});
	}
	
  ngOnDestroy(): void {
    this.unsubscribe_.next();
    this.unsubscribe_.complete();
    this.actionbar_.onDetailsLeave.emit();
  }
	
	getDetailsHref(name: string, namespace: string): string {
	  return `/mesh/config/${namespace}/${name}`;
	}
	goConfig(name: string, namespace: string): void{
    let queryParams: NavigationExtras = {
      queryParams:{'namespace':namespace}
    }
		this.router.navigate([`/mesh/config/${namespace}/${name}`], queryParams);
	}
	addNamespace(namespace: any): void {
	
		const url = RawResource.getUrl(namespace.typeMeta, namespace.objectMeta);
		this.http_.get(url, {headers: this.getHttpHeaders_(), responseType: 'text'})
		.subscribe(_result => {
			const result = JSON.parse(_result)
			if(!result.metadata.labels){
				result.metadata.labels = {};
			}
			result.metadata.labels['openservicemesh.io/monitored-by'] = this.meshconfig.meshName;
			if(!result.metadata.annotations){
				result.metadata.annotations = {};
			}
			result.metadata.annotations['openservicemesh.io/metrics'] = "enabled";
			result.metadata.annotations['openservicemesh.io/sidecar-injection'] = "enabled";
			this.http_.put(url, result, {headers: this.getHttpHeaders_(), responseType: 'text'})
			.subscribe(_ => {
				this.loadNamespace();
			}, this.handleErrorResponse_.bind(this));
		});
	}
  private getHttpHeaders_(): HttpHeaders {
    const headers = new HttpHeaders();
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    return headers;
  }
  private handleErrorResponse_(err: HttpErrorResponse): void {
    if (err) {
      const alertDialogConfig: MatDialogConfig<AlertDialogConfig> = {
        width: '630px',
        data: {
          title: err.statusText === 'OK' ? 'Internal server error' : err.statusText,
          message: err.error || 'Could not perform the operation.',
          confirmLabel: 'OK',
        },
      };
      this.dialog_.open(AlertDialog, alertDialogConfig);
    }
  }
  showWorkloadStatuses(): boolean {
    return Object.values(this.resourcesRatio).reduce((sum, ratioItems) => sum + ratioItems.length, 0) !== 0;
  }
}
