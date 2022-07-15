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
import {ChangeDetectionStrategy,ChangeDetectorRef, Component, ViewChild, ElementRef, Input} from '@angular/core';
import {Observable} from 'rxjs';

import {NotificationsService} from '@common/services/global/notifications';
import {Trace, TraceList} from 'typings/root.api';
import {ResourceListWithStatuses} from '@common/resources/list';
import {NamespacedResourceService} from '@common/services/resource/resource';
import {JaegerService} from '@common/services/global/jaeger';
import {VerberService} from '@common/services/global/verber';
import {ObjectMeta, TypeMeta} from '@api/root.api';
import {ListGroupIdentifier, ListIdentifier} from '../groupids';

@Component({
  selector: 'kd-trace-list',
  templateUrl: './template.html',
  styleUrls: ['./style.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TraceListComponent extends ResourceListWithStatuses<TraceList, Trace> {
  @Input() initialized = false;
  @Input() objectMeta:ObjectMeta;
  @Input() typeMeta:TypeMeta;
	
	traceList:any;
	endpointMap:any = {};
	endpointhover:string = null;
	endpoints:Array<Array<any>> = [];
  constructor(
    notifications: NotificationsService,
    cdr: ChangeDetectorRef,
    private readonly verber_: VerberService,
    private readonly jaeger_: JaegerService
  ) {
    super('trace', notifications, cdr);
    this.id = ListIdentifier.trace;
    this.groupId = ListGroupIdentifier.discovery;
		
  }
	ngOnChanges(){
		this.loadEP();
	}
	loadEP(){
		if(this.initialized){
			this.jaeger_.getServicePath(this.typeMeta,this.objectMeta).subscribe(_ => {
				this.endpoints = [];
				this.endpointMap = {'space':{name:'space',flex:10,arrows:[],parent:[]}};
				let data:Array<any> = JSON.parse(_).data;
				data.forEach((item)=>{
					if(!(this.endpointMap[item.parent])){
						this.endpointMap[item.parent] = {name:item.parent,flex:10,arrows:[],parent:[]}
					}
					this.endpointMap[item.parent].arrows.push({count:item.callCount,target:item.child})
					if(!this.endpointMap[item.child]){
						this.endpointMap[item.child] = {name:item.child,flex:10,arrows:[],parent:[]}
					}
					this.endpointMap[item.child].parent.push(item.parent)
				})
				
				let current:number = 0
				this.endpoints[current]=[];
				Object.keys(this.endpointMap).forEach(_key => {
					if(_key!='space'&&this.endpointMap[_key].parent.length==0){
						if(!this.endpointhover){
							this.endpointhover = _key;
						this.jaeger_.doJaegerChange();
						}
						this.endpoints[current].push(this.endpointMap[_key])
					}
				})
				this.nextEP(current+1);
				this.cdr_.markForCheck();
			});
		}
	}
	nextEP(current:number) {
		let arrowLength = 0;
		const maxFlex = 2520;
		this.endpoints[current]=[];
		this.endpoints[current-1].forEach(lastEP => {
			lastEP.arrows.forEach((arrow:any) => {
				this.endpoints[current].push({...this.endpointMap[arrow.target],flex:maxFlex*lastEP.flex/lastEP.arrows.length});
				arrowLength+=this.endpointMap[arrow.target].arrows.length;
			});
			if(lastEP.arrows.length == 0){
				this.endpoints[current].push({name:'space',arrows:[],parent:[],flex:maxFlex*lastEP.flex});
			}
		});
		if(arrowLength>0){
			this.nextEP(current+1);
		}
	}
	changeHover(name:string){
		this.endpointhover = name;
		this.jaeger_.doJaegerChange();
	}
	// getTraceList(){
	// 	this.jaeger_.getTraceList(this.endpointhover,this.typeMeta,this.objectMeta).subscribe(_ => {
	// 		let data:Array<any> = JSON.parse(_).data;
	// 		this.traceList = data;
	// 		this.cdr_.markForCheck();
	// 		console.log(data)
	// 	});
	// }
	
  getResourceObservable(params?: HttpParams): Observable<any> {
		console.log(params);
		return this.jaeger_.getTraceList(this.endpointhover,this.typeMeta,this.objectMeta,params);
  }

  map(resp: any): Trace[] {
		resp.forEach((item:any)=>{
			item.processKeys = Object.keys(item.processes);
		});
		setTimeout(()=>{
			this.jaeger_.doTraceChange();
		},100);
    return resp;
  }
	openTraceDetail(trace: any){
		this.verber_.showTraceDetailDialog(trace);
	}
  getDisplayColumns(): string[] {
    return ['traceID', 'spans', 'processes', 'time'];
  }

	getConfigHref(name: string, namespace: string): string {
	  return `/mesh/config/${namespace}/${name}`;
	}
}
