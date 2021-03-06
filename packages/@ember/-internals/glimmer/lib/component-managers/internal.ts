import { Owner } from '@ember/-internals/owner';
import { assert } from '@ember/debug';
import {
  CapturedNamedArguments,
  Destroyable,
  DynamicScope,
  Environment,
  InternalComponentCapabilities,
  InternalComponentManager,
  VMArguments,
  WithCreateInstance,
} from '@glimmer/interfaces';
import { createConstRef, isConstRef, Reference, valueForRef } from '@glimmer/reference';

const CAPABILITIES: InternalComponentCapabilities = {
  dynamicLayout: false,
  dynamicTag: false,
  prepareArgs: false,
  createArgs: true,
  attributeHook: false,
  elementHook: false,
  createCaller: true,
  dynamicScope: false,
  updateHook: false,
  createInstance: true,
  wrapped: false,
  willDestroy: false,
  hasSubOwner: false,
};

export interface InternalComponentState {
  env: Environment;
  instance: Destroyable;
}

export interface EmberInternalComponentConstructor {
  new (owner: Owner, args: CapturedNamedArguments, caller: unknown): Destroyable;
}

export default class InternalManager
  implements
    InternalComponentManager<InternalComponentState, EmberInternalComponentConstructor>,
    WithCreateInstance {
  constructor(private ComponentClass: EmberInternalComponentConstructor, private name: string) {}

  getCapabilities(): InternalComponentCapabilities {
    return CAPABILITIES;
  }

  create(
    owner: Owner,
    _definition: unknown,
    args: VMArguments,
    env: Environment,
    _dynamicScope: DynamicScope,
    caller: Reference
  ): InternalComponentState {
    assert('caller must be const', isConstRef(caller));

    assert(
      `The ${this.name} component does not take any positional arguments`,
      args.positional.length === 0
    );

    let { ComponentClass } = this;
    let instance = new ComponentClass(owner, args.named.capture(), valueForRef(caller));

    let state = { env, instance };

    return state;
  }

  didCreate(): void {}
  didUpdate(): void {}

  didRenderLayout(): void {}
  didUpdateLayout(): void {}

  getDebugName(): string {
    return this.name;
  }

  getSelf({ instance }: InternalComponentState): Reference {
    return createConstRef(instance, 'this');
  }

  getDestroyable(state: InternalComponentState): Destroyable {
    return state.instance;
  }
}
