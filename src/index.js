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
        if (Array.isArray(steps)) {
            this._steps = steps;
            this._stepsByID = steps.reduce((result, step, index) => {
                result[index] = index;
                return result;
            }, {});
        } else if (typeof(steps) === "object") {
            const {fns, stepsByID} = Object.entries(steps).reduce((result, [id, fn], index) => {
                result.fns.push(fn);
                result.stepsByID[id] = index;
                return result;
            }, {
                "fns":[],
                "stepsByID":{}
            });
            this._steps = fns;
            this._stepsByID = stepsByID;
        } else {
            throw new Error("Steps Must Either Be An ARRAY of FUNCTION or an OBJECT");
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
            throw new Error("Steps By ID Must Be An OBJECT");
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
    // Adds "step" function to continuation:
    step(...args) {

        // Compute signature from arguments:
        const [a, b] = args;
        const signature = Continuator.signature(args);
        
        // Match signature to how we need to handle those arguments:
        switch (signature) {
            case "function":
                this.steps.push(a)
                this.stepsByID[this.steps.length - 1] = this.steps.length - 1;
            break;
            case "string,function":
                this.steps.push(b)
                this.stepsByID[a] =  this.steps.length - 1;
            break;
            default:

        }
        
        // Make method "chainable":
        return this;
    }

    // :: Continuator, BOOL|VOID -> this
    // Composes the steps of a given Continuator instance with this instance:
    // NOTE: If overwrite is true, steps By ID will be overwrriten for this instance
    // NOTE: If step has no explicit ID, then a new stepID is computed based on the index of this instance:
    // NOTE: This means if the composed with instance is referencing  steps by index - they aren't guarnteed to work with the updated index:
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

    // :: *, (* -> *) -> *
    // Applies steps of this continuation to a given value, otherwise runs given function if continuation is terminated:
    run(intialValue, onHalt) {

        let step = 0;             // Keeps track of step count
        let value = intialValue;  // Reference to value that steps are being applied to
        let halted = false;       // Determines if continuation has terminated or not          

        // How to process next step of continuation:
        const nextStep = (nextValue) => {
            if (!halted) {
                value = nextValue;
                step += 1;
            }
        }

        // How to handle terminated continuation:
        const haltStep = (haltValue) => {
            halted = true; 
            value = typeof(onHalt) === "function" 
                ? onHalt(haltValue)
                : haltValue
        }

        // How to call a specific step function by ID
        const gotoStep =(stepID) => {
            if (!halted) {
                step = this.stepsByID[stepID];
                if (step === undefined) {
                    throw new Error("No Step Found For Given ID");
                }
            }
        }

        // Process each step of the continuation using a deferred function to avoid recursive stack overflow:
        const processStep = () => {
            if (step < this.steps.length && !halted) {
                this.steps[step](value, nextStep, haltStep, gotoStep);
                return () => processStep();
            }
            return value;
        };

        // Return processed value of continuation:
        return Continuator.trampoline(processStep)();

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

    // :: FUNCTION -> * -> *
    // Implement a trampoline for preventing recursive stack overflow:
    static trampoline(fn) {
        return (...args) => {
            let result = fn(...args);
            while (typeof result === 'function') {
                result = result();
            }
            return result;
        };
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
            throw new Error(`Can Only Compute A Signature From An ARRAY Of Values`);
        }
    }

}
