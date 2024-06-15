// For handling errors thrown by a continuator:
export default class ContinuatorError extends Error {

    // CONSTRUCTOR :: STRING|ERROR, [{stepIndex:NUMBER, stepID:STRING, currentValue:*}]|VOID -> this
    constructor(err, steps) {

        // Determines what needs set based on error either being a message or another ERROR instance:
        if (err instanceof Error) {
            super(err.message);         // Setting message of inital error
            this.name = err.name;       // Storing name of initial error
            this.stack = err.stack;     // Storing stack trace of initial error 
        } else {
            super(err);
            this.name = 'ContinuatorError';
        }

        // Only sets stepStack if given:
        if (steps) {
            this.steps = steps;
        }
  
    }

    /**
     * 
     * Lookups (GETTERs without SETTERs)
     * 
     */

    // :: VOID -> {stepIndex:NUMBER, stepID:STRING, currentValue:*}|NULL
    // Returns last step of collected steps - otherwise returns NULL if no steps are stored:
    get lastStep() {
        return Array.isArray(this.steps)
            ? this.steps[this.steps.length - 1]
            : null
    }

    // :: VOID -> STRING|NULL
    // Returns index of last step of collected step, otherwise returns NULL if no step are stored:
    get lastStepIndex() {
        return this.lastStep !== null 
            ? this.lastStep.stepIndex 
            : null;
    }

    // :: VOID -> STRING|NULL
    // Returns ID of last step of collected step, otherwise returns NULL if no step are stored:
    get lastStepID() {
        return this.lastStep !== null 
            ? this.lastStep.stepID 
            : null;
    }

    // :: VOID -> STRING|NULL
    // Returns index of last step of collected step, otherwise returns NULL if no step are stored:
    get lastStepValue() {
        return this.lastStep !== null 
            ? this.lastStep.currentValue 
            : null;
    }

    /**
     * 
     *  Instance Methods
     * 
     */

    // :: Promise.Reject -> VOID
    // Rejects promise using this instance of "ContinuatorError"::
    reject(reject) {
       reject(this)
    }

    /**
     * 
     *  Static Methods 
     * 
     */

    // Static Factory Method :: STRING|OBJECT, NUMBER|STRING|VOID -> ContinuatorError
    static init(err, steps) {
        return new ContinuatorError(err, steps);
    }

    // :: * -> VOID
    // Helper method for logging info determined by error type:
    static report(err) {
        if (err instanceof ContinuatorError) {
                console.error(err.stack);
                if (err.steps) {
                    console.error("Last Step:", err.lastStep)  
                    console.error("All Steps:", err.steps)
                }     
        } else {
            console.error(err);
        }
    }

}
