import { isEnabled } from '@ember/canary-features';
import applyMixins from './apply-mixins';
import getAllPropertyNames from './get-all-property-names';
import { all } from 'rsvp';

export default function moduleFor(description, TestClass, ...mixins) {
  QUnit.module(description, function(hooks) {
    setupTestClass(hooks, TestClass, ...mixins);
  });
}

export function setupTestClass(hooks, TestClass, ...mixins) {
  hooks.beforeEach(function(assert) {
    let instance = new TestClass(assert);
    this.instance = instance;
    if (instance.beforeEach) {
      return instance.beforeEach(assert);
    }
  });

  hooks.afterEach(function() {
    let promises = [];
    let instance = this.instance;
    this.instance = null;
    if (instance.teardown) {
      promises.push(instance.teardown());
    }
    if (instance.afterEach) {
      promises.push(instance.afterEach());
    }

    return all(promises);
  });

  if (mixins.length > 0) {
    applyMixins(TestClass, ...mixins);
  }

  let properties = getAllPropertyNames(TestClass);
  properties.forEach(generateTest);

  function shouldTest(features) {
    return features.every(feature => {
      if (feature[0] === '!' && isEnabled(feature.slice(1))) {
        return false;
      } else if (!isEnabled(feature)) {
        return false;
      } else {
        return true;
      }
    });
  }

  function generateTest(name) {
    if (name.indexOf('@test ') === 0) {
      QUnit.test(name.slice(5), function(assert) {
        return this.instance[name](assert);
      });
    } else if (name.indexOf('@only ') === 0) {
      // eslint-disable-next-line qunit/no-only
      QUnit.only(name.slice(5), function(assert) {
        return this.instance[name](assert);
      });
    } else if (name.indexOf('@skip ') === 0) {
      QUnit.skip(name.slice(5), function(assert) {
        return this.instance[name](assert);
      });
    } else {
      let match = /^@feature\(([A-Z_a-z-!]+)\) /.exec(name);

      if (match) {
        let features = match[1].replace(/ /g, '').split(',');

        if (shouldTest(features)) {
          QUnit.test(name.slice(match[0].length), function(assert) {
            return this.instance[name](assert);
          });
        }
      }
    }
  }
}
