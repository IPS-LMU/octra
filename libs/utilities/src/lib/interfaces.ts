export interface Serializable<S, T> {
  serialize(): S;

  deserialize(jsonObject: S): T;
}

export abstract class SerializableClass<S, T> {
  static deserializable<S, T>(jsonObject: S): T {
    throw new Error('not implemented');
  }
}
