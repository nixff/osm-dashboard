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

import {Component, Inject, Input} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ResourceMeta} from '../../services/global/actionbar';
import {FlatTreeControl} from '@angular/cdk/tree';
import {MatTreeFlatDataSource, MatTreeFlattener} from '@angular/material/tree';


interface FoodNode {
  name: string;
	start: any;
	width: any;
	duration: any,
	isExpanded: boolean,
  children?: FoodNode[];
}

/** Flat node with expandable and level information */
interface ExampleFlatNode {
  expandable: boolean;
  name: string;
	start: any,
	width: any,
	duration: any,
	isExpanded: boolean,
  level: number;
}


@Component({
  selector: 'kd-trace-detail-resource-dialog',
  templateUrl: 'template.html',
  styleUrls: ['./style.scss'],
})
export class TraceDetailResourceDialog {
  @Input() trace:any;
	
  private _transformer = (node: FoodNode, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      start: node.start,
      width: node.width,
			duration: node.duration,
			isExpanded: true,
      level: level,
    };
  };

  treeControl = new FlatTreeControl<ExampleFlatNode>(
    node => node.level,
    node => node.expandable,
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children,
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
	
	minTime = -1;
	maxTime = -1;
	minTimeLabel:any = null;
	maxTimeLabel:any = null;
	
  constructor(
    public dialogRef: MatDialogRef<TraceDetailResourceDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
		// this.dataSource.data = TREE_DATA;
		this.trace = this.data.trace;
		this.dataSource.data = this.findChild(this.trace.traceID, 0);
		this.treeControl.expandAll();
	}
	findChild(spanID:string, level: number): FoodNode[] {
		//startTime
		//duration
		let rtn:FoodNode[] = [];
		if(level == 0){
			this.trace.spans.forEach((span:any) => {
				if(span.spanID == spanID){
					this.minTime = span.startTime;
					this.maxTime = span.startTime + span.duration;
					this.minTimeLabel = new Date(this.minTime/1000).toLocaleString();
					this.maxTimeLabel = new Date(this.maxTime/1000).toLocaleString();
					rtn.push({
						name: span.operationName,
						start:(span.startTime - this.minTime)*100/(this.maxTime - this.minTime),
						width:span.duration*100/(this.maxTime - this.minTime),
						duration: Math.ceil(span.duration/1000),
						isExpanded: true,
						children: this.findChild(span.spanID, level+1)
					});
				}
			})
		} else {
			this.trace.spans.forEach((span:any) => {
				if(span.references && span.references.length>0 && span.references[0].spanID == spanID){
					rtn.push({
						name: span.operationName,
						start:(span.startTime - this.minTime)*100/(this.maxTime - this.minTime),
						width:span.duration*100/(this.maxTime - this.minTime),
						duration: Math.ceil(span.duration/1000),
						isExpanded: true,
						children: this.findChild(span.spanID, level+1)
					});
				}
			})
		};
		return rtn
	}
	hasChild = (_: number, node: ExampleFlatNode) => node.expandable;
  onNoClick(): void {
    this.dialogRef.close();
  }
}
