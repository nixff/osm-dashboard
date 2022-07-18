import { Component, NgModule, Input } from '@angular/core';
import { JaegerService } from '@common/services/global/jaeger';

@Component({
  selector: 'kd-bubble',
  templateUrl: './template.html',
  styleUrls: ['./style.scss']
})
export class BubbleComponent {
  @Input() dataSource: any;
  bubbleData: any[];
  view: any[] = [1200, 300];

  // options
  showXAxis: boolean = true;
  showYAxis: boolean = true;
  gradient: boolean = false;
  showLegend: boolean = false;
  showXAxisLabel: boolean = false;
  yAxisLabel: string = 'ms';
  showYAxisLabel: boolean = true;
  xAxisLabel: string = 'Time';
  minRadius: number = 5;
  yScaleMin: number = 0;
	yScaleMax: number = 0;

  colorScheme = {
    domain: ['#5d8aec']
  };

  constructor(private readonly jaeger_: JaegerService) {
    // Object.assign(this, { bubbleData });
  }

  ngOnInit(): void {
		this.jaeger_.onTraceChange.subscribe(() => {
			//this.dataSource.filteredData
			let bubbleData:any[] = [];
			this.dataSource.filteredData.forEach((item: any)=>{
				this.yScaleMax = this.yScaleMax>(item.spans[0].duration+100)?this.yScaleMax:(item.spans[0].duration+100);
				bubbleData.push({
					name: 'trace-'+item.traceID,
					series: [
						{
							name: item.spans[0].operationName,
							x: new Date(item.spans[0].startTime),
							y: item.spans[0].duration,
							r: item.spans.length
						}
					]
				});
			});
			Object.assign(this, { bubbleData });
		});
	}
  onSelect(data:any): void {
    console.log('Item clicked', JSON.parse(JSON.stringify(data)));
  }

  onActivate(data:any): void {
    console.log('Activate', JSON.parse(JSON.stringify(data)));
  }

  onDeactivate(data:any): void {
    console.log('Deactivate', JSON.parse(JSON.stringify(data)));
  }
}
