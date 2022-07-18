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

import {Component, OnDestroy, OnInit, ChangeDetectorRef} from '@angular/core';
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
import {AlertDialogConfig, AlertDialog} from 'common/dialogs/alert/dialog';
import lodash from 'lodash';
import {
	MeshconfigDetail,
  Namespace,
  NamespaceList,
} from '@api/root.api';

@Component({
  selector: 'kd-mesh-trace',
  templateUrl: './template.html',
  styleUrls: ['style.scss'],
})
export class MeshTraceComponent extends GroupedResourceList implements OnInit, OnDestroy {
  meshconfig: MeshconfigDetail;
  namespaces: any;
  isInitialized = false;

  private readonly kdState_: KdStateService = GlobalServicesModule.injector.get(KdStateService);
  private readonly endpoint_ = EndpointManager.resource(Resource.meshconfig, true);
  private readonly unsubscribe_ = new Subject<void>();

  constructor(
		private router: Router,
    private readonly http_: HttpClient,
    private readonly namespace_: NamespaceService,
    private readonly service_: NamespacedResourceService<MeshconfigDetail>,
    private readonly actionbar_: ActionbarService,
    private readonly activatedRoute_: ActivatedRoute,
    private readonly notifications_: NotificationsService,
    private readonly cdr_: ChangeDetectorRef
  ) {
		super();
	}

  ngOnInit(): void {
    const resourceName = this.activatedRoute_.snapshot.params.resourceName;
    const resourceNamespace = this.activatedRoute_.snapshot.params.resourceNamespace;

    this.service_
      .get(this.endpoint_.detail(), resourceName, resourceNamespace)
      .pipe(takeUntil(this.unsubscribe_))
      .subscribe((d: MeshconfigDetail) => {
        this.meshconfig = d;
        this.notifications_.pushErrors(d.errors);
        this.actionbar_.onInit.emit(new ResourceMeta('Meshconfig', d.objectMeta, d.typeMeta));
        this.isInitialized = true;
				this.cdr_.markForCheck();
      });
  }
	
  ngOnDestroy(): void {
    this.unsubscribe_.next();
    this.unsubscribe_.complete();
    this.actionbar_.onDetailsLeave.emit();
  }
}
