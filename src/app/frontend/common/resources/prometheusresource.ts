import {ObjectMeta,TypeMeta} from '@api/root.api';

export class PrometheusResource {
  static getMeshUrl(objectMeta: ObjectMeta, query: string): string {
    let resourceUrl = `api/v1/meshconfig/${objectMeta.namespace}/${objectMeta.name||'all'}/prometheus/${query}`;
    return resourceUrl;
  }
  static getBaseUrl(objectMeta: ObjectMeta, query: string): string {
    let resourceUrl = `api/v1/prometheus/${objectMeta.namespace}/${query}`;
    return resourceUrl;
  }
	static getUrl(typeMeta: TypeMeta, objectMeta: ObjectMeta, query: string, isInit: boolean): string {
		// alert(typeMeta.kind);
		let end = new Date().getTime() / 1000;
		let start = new Date().setHours(new Date().getHours() - 6) / 1000;
		let timeFilter = `&step=15&start=${start}&end=${end}`;
		let append = isInit?encodeURIComponent(`${query}${timeFilter}`):encodeURIComponent(query);
		let queryPath = isInit?'query_range':'query';
		if(typeMeta.kind == 'meshconfig'){
			return this.getMeshUrl(objectMeta,`${queryPath}?query=${append}`);
		} else {
			return this.getBaseUrl(objectMeta,`${queryPath}?query=${append}`);
		}
	}
}