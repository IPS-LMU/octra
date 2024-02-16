import io from './inputs_outputs.set.json';

export * from './guidelines';
export * from './logging.schema';
export * from './projectconfig.schema';

export const IO_SETS = {
  inputs: io.inputs,
  outputs: io.outputs
};
