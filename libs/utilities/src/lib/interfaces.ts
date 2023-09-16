export interface Serializable<S, T> {
  serialize(): S;

  deserialize(jsonObject: S, sampleRate: number): T | undefined;
}

export abstract class SerializableClass<S, T> {
  static deserializable<S, T>(jsonObject: S, sampleRate: number): T | undefined {
    throw new Error('not implemented');
  }
}
