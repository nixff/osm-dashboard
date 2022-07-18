import { Component, NgModule, Input } from '@angular/core';
import { PrometheusService } from '@common/services/global/prometheus';

@Component({
  selector: 'kd-line',
  templateUrl: './template.html',
  styleUrls: ['./style.scss']
})
export class LineComponent {
  @Input() dataSource: any[];
	@Input() width: number = 550;
	@Input() height: number = 300;
	@Input() xAxisLabel: string = 'Year';
	@Input() yAxisLabel: string = 'Population';
	@Input() colors: string[] = ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5', '#a8385d', '#aae3f5'];

	// options
	legend: boolean = true;
	animations: boolean = true;
	xAxis: boolean = true;
	yAxis: boolean = true;
	showYAxisLabel: boolean = true;
	showXAxisLabel: boolean = false;
	timeline: boolean = true;
	legendPosition: 'below';
	
  constructor(private readonly prometheus_: PrometheusService) {
		// this.prometheus_.onMetricChange.subscribe(() => {
		// });
	}

	onSelect(data: any): void {
		console.log('Item clicked', JSON.parse(JSON.stringify(data)));
	}

	onActivate(data: any): void {
		console.log('Activate', JSON.parse(JSON.stringify(data)));
	}

	onDeactivate(data: any): void {
		console.log('Deactivate', JSON.parse(JSON.stringify(data)));
	}
}