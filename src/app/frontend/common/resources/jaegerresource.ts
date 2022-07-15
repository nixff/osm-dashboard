import {ObjectMeta, TypeMeta} from '@api/root.api';

export class JaegerResource {
  static getUrl(typeMeta: TypeMeta, objectMeta: ObjectMeta, append: string): string {
    let resourceUrl = `api/v1/${typeMeta.kind}/${objectMeta.namespace}/${objectMeta.namespace}/tracing/${append}`;
    return resourceUrl;
  }
}