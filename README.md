# Continuator

`Continuator` is a JavaScript library designed to manage complex execution flows using a sequence of steps (functions) applied to a value. It provides a flexible mechanism to handle continuation-like execution control, dynamic actor-like behaviors, and combinator-like composition. This makes it particularly useful for scenarios requiring adaptive, non-linear, and asynchronous processing.

## How It Works

The `Continuator` class allows you to define a series of steps that can be applied to a value. Each step is a function that can:
- Continue to the next step using the `next` function.
- Halt the execution using the `halt` function.
- Redirect to a different step using the `goto` function.

These steps can be composed, removed, and managed dynamically, providing a high degree of control over the execution flow. Steps can be added either through the constructor or by chaining the `step` method.

## Where to Apply It

`Continuator` is suitable for:
- **Complex Workflows**: Managing intricate sequences of operations that require dynamic control flow.
- **Asynchronous Processing**: Handling tasks that involve asynchronous operations, such as network requests or file I/O.
- **Stateful Pipelines**: Implementing pipelines that need to maintain and transform state across multiple steps.
- **Error Handling**: Providing robust error handling and recovery mechanisms within a sequence of operations.


## Usage Examples

**Example 1: Basic Usage**

```javascript
import Continuator, {ContinuatorError} from 'continuator';

// Define step functions
const step1 = (value, next, halt, goto) => {
    if (value > 10) {
        next(value * 2);
    } else {
        halt('Value is too small');
    }
};

const step2 = (value, next, halt, goto) => {
    next(value + 5);
};

// Initialize the Continuator
Continuator([step1, step2]);

// Run the pipeline
pipeline.run(15)
    .then(result => {
        console.log('Pipeline result:', result);
    })
    .catch(err => {
        if (err instanceof ContinuatorError) {
            err.report();
        } else {
            console.error('Unexpected error:', err);
        }
    });
```

**Example 2: Using `goto` for Non-Linear Execution**

```javascript
import Continuator from 'continuator';

const step1 = (value, next, halt, goto) => {
    if (value > 10) {
        goto('step3');
    } else {
        next(value * 2);
    }
};

const step2 = (value, next, halt, goto) => {
    next(value + 5);
};

const step3 = (value, next, halt, goto) => {
    halt('Jumped to step3');
};

const pipeline = new Continuator({
    step1,
    step2,
    step3
});

pipeline.run(15)
    .then(result => {
        console.log('Pipeline result:', result);
    })
    .catch(err => {
        console.error('Pipeline error:', err);
    });
```

**Example 3: Composing Continuators**

```javascript
import Continuator from 'continuator';

const stepA = (value, next, halt, goto) => {
    next(value + 1);
};

const stepB = (value, next, halt, goto) => {
    next(value * 2);
};

const pipeline1 = new Continuator([stepA]);
const pipeline2 = new Continuator([stepB]);

pipeline1.compose(pipeline2);

pipeline1.run(5)
    .then(result => {
        console.log('Composed pipeline result:', result); // Should output 12
    })
    .catch(err => {
        console.error('Pipeline error:', err);
    });
```

**Example 4: Debugging a Pipeline**

```javascript
import Continuator from 'continuator';

const step1 = (value, next, halt, goto) => {
    next(value * 2);
};

const step2 = (value, next, halt, goto) => {
    if (value > 20) {
        halt('Value too large');
    } else {
        next(value + 5);
    }
};

const pipeline = new Continuator([step1, step2]);

pipeline.debug(15)
    .then(result => {
        console.log('Debug pipeline result:', result);
    })
    .catch(err => {
        if (err instanceof ContinuatorError) {
            err.report();
        } else {
            console.error('Unexpected error:', err);
        }
    });
```

**Example 5: Chaining Steps**

```javascript
import Continuator from 'continuator';
import ContinuatorError from 'continuator-error';

// Define step functions
const step1 = (value, next, halt, goto) => {
    if (value > 10) {
        next(value * 2);
    } else {
        halt('Value is too small');
    }
};

const step2 = (value, next, halt, goto) => {
    next(value + 5);
};

const step3 = (value, next, halt, goto) => {
    if (value > 30) {
        halt('Value is too large');
    } else {
        next(value);
    }
};

// Initialize an empty Continuator
const pipeline = new Continuator();

// Chain steps together
pipeline
    .step(step1)
    .step(step2)
    .step(step3);

// Run the pipeline
pipeline.run(15)
    .then(result => {
        console.log('Pipeline result:', result); // Should output 35
    })
    .catch(err => {
        if (err instanceof ContinuatorError) {
            err.report();
        } else {
            console.error('Unexpected error:', err);
        }
    });
```

## Notice

`Continuator` is very much a work in progress. Things seems to be stable but there is still much testing and benchmarking to be done. Documentation is also in draft right now given it's being produced by ChatGPT - but at least it's something for 