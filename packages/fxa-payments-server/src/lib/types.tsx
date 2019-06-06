// TODO: Maybe flesh this out to match a convict config definition?
export interface Config {
  [propName: string]: any;
};

export interface QueryParams {
  plan?: string,
  activated?: string
};

export interface GenericObject {
  [propName: string]: any
}