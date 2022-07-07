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

import {NgModule} from '@angular/core';
import {Route, RouterModule} from '@angular/router';
import {DEFAULT_ACTIONBAR} from '@common/components/actionbars/routing';
import {BREADCRUMBS} from '../../../index.messages';

import {OSM_ROUTE} from '../routing';

import {MeshConfigComponent} from './config/component';
import {MeshDetailComponent} from './detail/component';
import {MeshListComponent} from './list/component';

const MESHCONFIG_LIST_ROUTE: Route = {
  path: '',
  component: MeshListComponent,
  data: {
    breadcrumb: BREADCRUMBS.Meshconfigs,
    parent: OSM_ROUTE,
  },
};

const MESHCONFIG_DETAIL_ROUTE: Route = {
  path: ':resourceNamespace/:resourceName',
  component: MeshDetailComponent,
  data: {
    breadcrumb: '{{ resourceName }}',
    parent: MESHCONFIG_LIST_ROUTE,
  },
};

const MESHCONFIG_CONFIG_ROUTE: Route = {
  path: 'config/:resourceNamespace/:resourceName',
  component: MeshConfigComponent,
  data: {
    breadcrumb: '{{ resourceName }}',
    parent: MeshDetailComponent,
  },
};

@NgModule({
  imports: [RouterModule.forChild([MESHCONFIG_LIST_ROUTE, MESHCONFIG_DETAIL_ROUTE, MESHCONFIG_CONFIG_ROUTE, DEFAULT_ACTIONBAR])],
  exports: [RouterModule],
})
export class MeshRoutingModule {}
