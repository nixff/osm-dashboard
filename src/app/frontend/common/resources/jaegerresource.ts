import {ObjectMeta,TypeMeta} from '@api/root.api';

export class JaegerResource {
  static getMeshUrl(objectMeta: ObjectMeta, append: string): string {
    let resourceUrl = `api/v1/meshconfig/${objectMeta.namespace}/${objectMeta.name||'all'}/tracing/${append}`;
    return resourceUrl;
  }
  static getBaseUrl(objectMeta: ObjectMeta, append: string): string {
    let resourceUrl = `api/v1/tracing/${objectMeta.namespace}/${append}`;
    return resourceUrl;
  }
	
	static getUrl(typeMeta: TypeMeta, objectMeta: ObjectMeta, append: string): string {
		if(typeMeta.kind == 'meshconfig'){
			return this.getMeshUrl(objectMeta,append);
		} else {
			return this.getBaseUrl(objectMeta,append);
		}
	}
}