## `ContinuatorError` Class

The `ContinuatorError` class is an extension of the native JavaScript `Error` class designed to handle errors thrown by a continuator. This class encapsulates additional context and debugging information related to the steps executed by the continuator.

### Constructor

#### `constructor(err: string | Error, steps?: Array<{stepIndex: number, stepID: string, currentValue: *}>)`

- **Parameters:**
  - `err`: Either an error message (`string`) or an `Error` instance.
  - `steps` (optional): An array of objects, each representing a step in the continuator with the following properties:
    - `stepIndex`: The index of the step.
    - `stepID`: The ID of the step.
    - `currentValue`: The current value processed by the step.

- **Description:**
  Constructs a new `ContinuatorError` instance. If `err` is an instance of `Error`, it copies the message, name, and stack trace from the original error. If `err` is a string, it sets it as the error message. Optionally, it can store a `steps` array for debugging purposes.

### Properties

#### `lastStep: {stepIndex: number, stepID: string, currentValue: *} | null`

- **Returns:**
  The last step in the `steps` array, or `null` if no steps are stored.

#### `lastStepIndex: number | null`

- **Returns:**
  The index of the last step in the `steps` array, or `null` if no steps are stored.

#### `lastStepID: string | null`

- **Returns:**
  The ID of the last step in the `steps` array, or `null` if no steps are stored.

#### `lastStepValue: * | null`

- **Returns:**
  The current value of the last step in the `steps` array, or `null` if no steps are stored.

### Instance Methods

#### `reject(reject: Function): void`

- **Parameters:**
  - `reject`: A promise reject function.

- **Description:**
  Rejects a promise using this instance of `ContinuatorError`.

### Static Methods

#### `static init(err: string | Error, steps?: Array<{stepIndex: number, stepID: string, currentValue: *}>): ContinuatorError`

- **Parameters:**
  - `err`: Either an error message (`string`) or an `Error` instance.
  - `steps` (optional): An array of objects, each representing a step in the continuator.

- **Returns:**
  A new instance of `ContinuatorError`.

- **Description:**
  A factory method for creating a new `ContinuatorError` instance.

#### `static report(err: *): void`

- **Parameters:**
  - `err`: An error to be reported.

- **Description:**
  Logs detailed information about the error. If `err` is an instance of `ContinuatorError`, it logs the steps and the last step executed. Otherwise, it logs the error as is.
