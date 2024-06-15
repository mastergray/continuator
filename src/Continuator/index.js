// Dependencies:
import ContinuatorError from "../ContinuatorError/index.js"; // For handling errors thrown by a continuator

// Implements the "continuator" as a synthesis of continuation-like execution control, dynamic actor-like behaviors, and combinator-like composition:
export default class Continuator {

    /* Instance Fields */

        _steps;     // Functions we are applying to some value;
        _stepsByID; // How we can reference any function we are applying to some value 

    // CONSTRUCTOR :: [(value:*, next:* -> *, halt:* -> *, goto:STRING -> VOID) -> VOID] -> this
    constructor(steps) {
        this.steps = steps ?? []   
    }

    /**
     * 
     *  Properties 
     * 
     */

    /*=======*
     * steps *
     *=======*/

    // SETTER :: [FUNCTION]|{ID:FUNCTION} -> VOID
    set steps(steps) {
        if (Array.isArray(steps) || typeof(steps) === "object") {
            const {fns, stepsByID} = Object.entries(steps).reduce((result, [id, fn], index) => {
                result.fns.push(fn.bind(this))
                result.stepsByID[id] = index;
                return result;
            }, {
                "fns":[],
                "stepsByID":{}
            });
            this._steps = fns;
            this._stepsByID = stepsByID;
        } else {
            throw new ContinuatorError("Steps Must Either Be An ARRAY of FUNCTION or an OBJECT");
        }
    }

    // GETTER :: VOID -> [FUNCTION]
    get steps() {
        return this._steps;
    }

    /*===========*
     * stepsByID *
     *===========*/

    // SETTER :: OBJECT -> VOID
    set stepsByID(stepsByID) {
        if (typeof(stepsByID) === "object" && !Array.isArray(stepsByID)) {
            this._stepsByID = stepsByID;
        } else {
            throw new ContinuatorError("Steps By ID Must Be An OBJECT");
        }
    }

    // GETTER :: VOID -> OBJECT
    get stepsByID() {
        return this._stepsByID;
    }

    /**
     * 
     *  Instance Methods
     * 
     */

    // :: STRING, (value:*, next:* -> *, halt:* -> *, goto:STRING -> VOID) -> VOID | (value:*, next:* -> *, halt:* -> *, goto:STRING -> VOID) -> VOID -> this
    // Adds "step" function to continuator:
    step(...args) {

        // Compute signature from arguments:
        const [a, b, c] = args;
        const signature = Continuator.signature(args);
        
        // Match signature to how we need to handle those arguments:
        switch (signature) {

            // Adds step function with step ID as index running in the context of "this" continuator:
            case "function":
                this.steps.push(a.bind(this))
                this.stepsByID[this.steps.length - 1] = this.steps.length - 1;
            break;
            
            // Adds step function with step ID as index running in the context of a given OBJECT:
            case "function,object":
                this.steps.push(a.bind(b))
                this.stepsByID[this.steps.length - 1] = this.steps.length - 1;
            break;

            // Adds step function with step ID as STRING running in the context of  "this" continuator:
            case "string,function":
                this.steps.push(b.bind(this))
                this.stepsByID[a] =  this.steps.length - 1;
            break;

            // Adds step function with step ID as STRING running in the context of a given OBJECT:
            case "string,function,object":
                this.steps.push(b.bind(c))
                this.stepsByID[a] =  this.steps.length - 1;
            break;

            // Throw an error for an unsupported signature:
            default:
                throw new ContinuatorError(`Invalid Step Signature: ${signature}`)
        }
        
        // Make method "chainable":
        return this;
    }

    // :: NUMBER|STRING -> this
    // Removes step by step ID or index otherwise throws an error if step can't be removed:
    removeStep(stepID) {

        // Get index using stepID:
        const index = this.stepsByID[stepID];

        // Remove step if it exists:
        if (index !== undefined) {

            // Remove step function:
            this.steps.splice(index, 1);

            // Remove step ID:
            delete this.stepsByID[index];
            
            // Make method chainable:
            return this;

        } 

        // Otherwise throw an error if step is undefined:
        throw new Error("Cannot remove step of unknown ID");

    }

    // :: NUMBER -> STRING|NULL
    // Returns step ID from given index, otherwise returns NULL if no step ID is found:
    stepIDByIndex(index) {
        for (const [stepID, stepIndex] of Object.entries(this._stepsByID)) {
            if (stepIndex === index) {
                return stepID;
            }
        }
        return null; 
    }

    // :: Continuator, BOOL|VOID -> this
    // Composes the steps of a given Continuator instance with this instance:
    // NOTE: If overwrite is true, steps By ID will be overwrriten for this instance
    // NOTE: If step has no explicit ID, then a new stepID is computed based on the index of this instance:
    // WARNING: This means if the composed with instance is referencing  steps by index - they aren't guarnteed to work with the updated index:
    compose(cont, overwrite) {
        Object.entries(cont.stepsByID).forEach(([stepID, stepIndex]) => {
            if (isNaN(parseInt(stepID))) {
                if (this.stepsByID[stepID] !== undefined && overwrite === true) {
                    this.steps[this.stepsByID[stepID]] = cont.steps[stepIndex];
                }
                if (this.stepsByID[stepID] === undefined) {
                    this.steps.push(cont.steps[stepIndex]);
                    this.stepsByID[stepID] =  this.steps.length - 1 
                }
            } else {
                this.steps.push(cont.steps[stepIndex]);
                const newStepIndex = this.steps.length - 1 
                this.stepsByID[newStepIndex] = newStepIndex
            }
        })
        return this;
    }

    // :: *, (* -> *) -> PROMISE(*)
    // Returns promise of applying steps of this continuator to a given value, otherwise runs given function if continuator is "halted":
    // NOTE: "Halting" a continuator is not the same as throwing an exception - it means we are terminating the continutar before all steps function have been applied to the inital vale
    // NOTE: When a continuator is terminated by "halting" a step - the continuator returns a promise for the "halted" value or the applied "onHalt" function to the "halted" value
    async run(intialValue, onHalt) {

        let step = 0;             // Keeps track of step count
        let value = intialValue;  // Reference to value that steps are being applied to
        let halted = false;       // Determines if continuator has terminated or not          

        // Iteratively awaits each application of a step function to the value :
        while (step < this.steps.length && !halted) {
            
            // Promise of value is resolved when any of the functions passed to the step function is resolved:
            value = await new Promise((resolve, reject) => {
                
                try {

                    // Step function we are currently processing:
                    this.steps[step](

                        // Value being passed to step funciton:
                        value, 

                        // "Next" function that can be called from step:
                        (nextValue) => {
                            if (!halted) {
                                step += 1;
                                resolve(nextValue);
                            }
                        },

                        // "Halt" function that can be called from step:
                        (haltValue) => {
                            halted = true; 
                            typeof(onHalt) === "function"
                                ? resolve(onHalt(haltValue)) 
                                : resolve(haltValue);
                        },

                        // "Goto" function can be called from step:
                        (gotoValue) => {

                            step = this.stepsByID[gotoValue]
                            step !== undefined
                                ? resolve(value)
                                : ContinuatorError.init("No Step Found For Given ID").reject(reject)
                           
                        }

                    );
                    
                } catch (err) {
                    
                    // Rejects promise if step function itself throws an error:
                    ContinuatorError.init(err).reject(reject);

                }

            });
        }

        // Returns promise of processed value: 
        return value;

    }

    // :: *, (* -> *) -> PROMISE(*)
    // This works ths same as "run", except it gives more detailed error information, along with keeping track of what steps were called until the error was thrown:
    async debug(intialValue, onHalt) {

        // Console out that debugging is active:
        console.log("\n\t*******************************");
        console.log("\t* CONTINUATOR DEBUGGING IS ON *");
        console.log("\t*******************************\n");

        let step = 0;             // Keeps track of step count
        let value = intialValue;  // Reference to value that steps are being applied to
        let halted = false;       // Determines if continuator has terminated or not    
        let stepStack = [];       // Stores each step that was called when debuging      

        // Iteratively awaits each application of a step function to the value :
        while (step < this.steps.length && !halted) {
            
            // Promise of value is resolved when any of the functions passed to the step function is resolved:
            value = await new Promise((resolve, reject) => {

                // Add current state of continuator to "step stack" for debuging:
                stepStack.push({
                    "stepIndex":step,
                    "stepID":this.stepIDByIndex(step),
                    "currentValue":value
                });
                
                try {

                    // Step function we are currently processing:
                    this.steps[step](

                        // Value being passed to step funciton:
                        value, 

                        // "Next" function that can be called from step:
                        (nextValue) => {
                            if (!halted) {
                                step += 1;
                                resolve(nextValue);
                            }
                        },

                        // "Halt" function that can be called from step:
                        (haltValue) => {
                            halted = true; 
                            typeof(onHalt) === "function"
                                ? resolve(onHalt(haltValue)) 
                                : resolve(haltValue);
                        },

                        // "Goto" function can be called from step:
                        (gotoValue) => {
                            step = this.stepsByID[gotoValue]
                            step !== undefined
                                ? resolve(value)
                                : ContinuatorError.init(`No Step Found For Given ID "${gotoValue}"`, stepStack).reject(reject)
                           
                        }

                    );
                    
                } catch (err) {
                    
                    // Rejects promise if step function itself throws an error:
                    ContinuatorError.init(err, stepStack).reject(reject);

                }

            });
        }

        // Returns promise of processed value: 
        return value;

    }

    /**
     * 
     *  Static Methods
     *  
     */

    // Static Factory Method :: [FUNCTION] -> Continuator
    static init(steps) {
        return new Continuator(steps);
    }

     // :: [*] -> [STRING]
    // Generates "signature" from an array of values
    // NOTE: This is needed for implementing method overriding using generic dispatch:
    static signature(val) {
        if (Array.isArray(val) === true) {
            return val.map(arg => {
                const type = typeof(arg);
                return type === "object" && Array.isArray(arg) === true ? "array" : type;
            }).join(',');
        } else {
            throw new ContinuatorError(`Can Only Compute A Signature From An ARRAY Of Values`);
        }
    }

    // :: VOID -> VOID
    // Helper function for logging value of Continuator:
    // NOTE: We check type of next so we can use this as "halt" handler as well:
    static log(value, next, halt) {
        console.log(value);
        if (typeof(next) === "function") {
            next(value);
        } else {
            return value;
        }
    }

}
