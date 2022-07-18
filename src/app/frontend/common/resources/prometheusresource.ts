import {ObjectMeta} from '@api/root.api';

export class PrometheusResource {
  static getUrl(objectMeta: ObjectMeta, query: string, isInit: boolean): string {
		let end = new Date().getTime() / 1000;
		let start = new Date().setHours(new Date().getHours() - 6) / 1000;
		let timeFilter = `&step=15&start=${start}&end=${end}`;
		let append = isInit?encodeURIComponent(`${query}${timeFilter}`):encodeURIComponent(query);
		let queryPath = isInit?'query_range':'query';
    let resourceUrl = `api/v1/meshconfig/${objectMeta.namespace}/${objectMeta.name||'all'}/prometheus/${queryPath}?query=${append}`;
    return resourceUrl;
  }
}