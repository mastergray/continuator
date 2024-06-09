## Continuator

The `Continuator` class is a versatile JavaScript utility designed to manage and control the flow of computations using a combination of continuation-passing style (CPS) and actor-like behavior. It allows for the dynamic addition, removal, and jumping between steps in a sequence of functions, providing a powerful mechanism to handle complex workflows, state transitions, and both synchronous and asynchronous operations.

### Key Features

- **Dynamic Step Management**: Easily add, remove, and reference steps in the computation.
- **Control Flow Functions**: Use `nextStep`, `haltStep`, and `gotoStep` to navigate the computation.
- **Trampoline for Recursion**: Prevent stack overflow in deep recursive calls with a trampoline function.
- **Synchronous and Asynchronous Handling**: Seamlessly handle both synchronous and asynchronous steps.
- **Composable**: Combine multiple `Continuator` instances to create complex workflows.

### How It Works

- **Initialization**: Initialize with an array of functions or an object mapping IDs to functions.
- **Execution**: Run the computation from an initial value, using control functions to manage flow.
- **Dynamic Control**: Jump to specific steps, halt the computation, or proceed to the next step based on conditions.

### Example Usage

#### Synchronous Functions

```javascript
const step1 = (value, next, halt, goto) => {
    console.log("Step 1:", value);
    if (value < 5) {
        next(value + 1);
    } else {
        goto("specialStep");
    }
};

const specialStep = (value, next, halt, goto) => {
    console.log("Special Step:", value);
    halt(value);
};

const steps = [step1, specialStep];
const continuator = new Continuator(steps);
continuator.run(0);
```

#### Asynchronous Functions

```javascript
const asyncStep1 = async (value, next, halt, goto) => {
    console.log("Async Step 1:", value);
    if (value < 5) {
        next(await someAsyncFunction(value + 1));
    } else {
        goto("specialStep");
    }
};

const asyncSpecialStep = async (value, next, halt, goto) => {
    console.log("Async Special Step:", value);
    halt(await someAsyncFinalFunction(value));
};

const someAsyncFunction = (value) => new Promise(resolve => setTimeout(() => resolve(value), 1000));
const someAsyncFinalFunction = (value) => new Promise(resolve => setTimeout(() => resolve(value * 2), 1000));

const asyncSteps = [asyncStep1, asyncSpecialStep];
const asyncContinuator = new Continuator(asyncSteps);

asyncContinuator.run(0).then(result => {
    console.log("Final Result:", result);
});
```

#### Composing Continuators

```javascript
const stepA = (value, next, halt, goto) => {
    console.log("Step A:", value);
    next(value + 1);
};

const stepB = (value, next, halt, goto) => {
    console.log("Step B:", value);
    halt(value * 2);
};

const continuatorA = new Continuator([stepA]);
const continuatorB = new Continuator([stepB]);

continuatorA.compose(continuatorB);
continuatorA.run(1);
```

## Notice

`Continuator` is very much a work in progress. Things seems to be stable but there is still much testing and benchmarking to be done. Documentation is also in draft right now given it's being produced by ChatGPT - but at least it's something for now. 