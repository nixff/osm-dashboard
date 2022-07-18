import {ObjectMeta} from '@api/root.api';

export class JaegerResource {
  static getUrl(objectMeta: ObjectMeta, append: string): string {
    let resourceUrl = `api/v1/meshconfig/${objectMeta.namespace}/${objectMeta.name||'all'}/tracing/${append}`;
    return resourceUrl;
  }
}