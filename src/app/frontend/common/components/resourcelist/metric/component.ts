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

import {HttpParams} from '@angular/common/http';
import {ChangeDetectionStrategy,ChangeDetectorRef, Component, ViewChild, ElementRef, Input, Output, EventEmitter} from '@angular/core';
import {Observable} from 'rxjs';

import {NotificationsService} from '@common/services/global/notifications';
import {Trace, TraceList} from 'typings/root.api';
import {OnListChangeEvent} from '@api/root.ui';
import {ResourceListWithStatuses} from '@common/resources/list';
import {NamespacedResourceService} from '@common/services/resource/resource';
import {PrometheusService} from '@common/services/global/prometheus';
import {VerberService} from '@common/services/global/verber';
import {ObjectMeta,TypeMeta} from '@api/root.api';
import lodash from 'lodash';

@Component({
  selector: 'kd-mesh-metric',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MeshMetricComponent {
  @Input() initialized = false;
  @Input() objectMeta:ObjectMeta;
  @Input() typeMeta:TypeMeta;
  @Output('onchange') onChange: EventEmitter<OnListChangeEvent> = new EventEmitter();
	
	tpsData: any;
	erData: any;
	latencyData: any;
  constructor(
    // cdr: ChangeDetectorRef,
    private readonly prometheus_: PrometheusService
  ) {
		
  }
	ngOnChanges(){
		this.loadData();
	}
	// ngOnInit(){
	// 	this.loadData();
	// }
	loadData(){
		this.prometheus_.getTPS(this.typeMeta, this.objectMeta,!this.tpsData).subscribe(_ => {
			this.tpsData = this.mapData(this.tpsData,_);
			this.prometheus_.doMetricChange();
		})
		this.prometheus_.getER(this.typeMeta, this.objectMeta,!this.erData).subscribe(_ => {
			this.erData = this.mapData(this.erData,_);
			this.prometheus_.doMetricChange();
		})
		this.prometheus_.getLatency(this.typeMeta, this.objectMeta,!this.latencyData).subscribe(_ => {
			this.latencyData = this.mapData(this.latencyData,_,function (d:any){return isNaN(d/1000)?0:(d/1000)});
			this.prometheus_.doMetricChange();
		})
	}
	mapData(lastData:any,_:string,make?: any): any{
		let map = lodash.cloneDeep(lastData);
		if(!map){
			map = {};
		}
		let resp = JSON.parse(_);
		resp.data.result.forEach((item:any)=>{
			
			let _key = ``;
			if(item.metric.sidecar_cluster_name){
				_key = `${item.metric.sidecar_cluster_name} - ${item.metric.source_service}`;
			}else if(item.metric.destination_name){
				_key = `${item.metric.source_name} -> ${item.metric.destination_name}`;
			}
			if(!map[_key]){
				map[_key] = [];
			}
			if(!!item.values){
				item.values.forEach((_v:any)=>{
					map[_key].push({name:new Date(_v[0]*1000),value:make?make(_v[1]):_v[1]});
				})
			}else if(!!item.value){
				map[_key].push({name:new Date(item.value[0]*1000),value:make?make(item.value[1]):item.value[1]});
			}
		});
		return map;
	}
	getArrayData(json: any): any[]{
		let rtn:any[] = [];
		if(json){
			Object.keys(json).forEach((_key)=>{
				rtn.push({
					name:_key,
					series:json[_key]
				})
			})
		}
		return rtn;
	}
}
